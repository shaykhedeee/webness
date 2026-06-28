import { randomUUID } from "node:crypto";
import { mkdir, appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  buildAuditResult,
  prepareAuditLeadInput,
  type AuditLeadInput,
  type AuditResult,
} from "@/lib/audit";

export const runtime = "nodejs";

interface AuditLeadRecord {
  id: string;
  createdAt: string;
  status: "new";
  source: "web-audit";
  input: AuditLeadInput;
  result: AuditResult;
  meta: {
    userAgent: string;
    referer: string;
  };
}

function getLeadsFilePath() {
  return (
    process.env.WEBNESS_AUDIT_LEADS_FILE ||
    path.join(process.cwd(), ".data", "audit-leads.jsonl")
  );
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  let payload: Partial<AuditLeadInput>;

  try {
    payload = (await request.json()) as Partial<AuditLeadInput>;
  } catch {
    return jsonResponse({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const prepared = prepareAuditLeadInput(payload);
  const hasErrors = Object.keys(prepared.errors).length > 0;

  if (hasErrors) {
    return jsonResponse({ ok: false, errors: prepared.errors }, 400);
  }

  const result = buildAuditResult(prepared.input);
  const record: AuditLeadRecord = {
    id: `audit_${Date.now()}_${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    status: "new",
    source: "web-audit",
    input: prepared.input,
    result,
    meta: {
      userAgent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
    },
  };

  try {
    const filePath = getLeadsFilePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    await appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");

    // Forward lead details to Express API Gateway for CRM, Resurgo webhooks, and Resend email funnels
    try {
      const apiBaseUrl = process.env.PUBLIC_API_URL || "http://localhost:3001";
      await fetch(`${apiBaseUrl}/api/webhooks/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record }),
      });
    } catch (apiErr) {
      console.error("Failed to forward lead to Express gateway:", apiErr);
    }

    return jsonResponse({
      ok: true,
      stored: true,
      id: record.id,
      result,
    });
  } catch {
    return jsonResponse({
      ok: true,
      stored: false,
      id: record.id,
      result,
      warning: "Audit request accepted, but local lead storage is unavailable.",
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return jsonResponse({ ok: false, error: "id parameter is required" }, 400);
  }

  try {
    const filePath = getLeadsFilePath();
    if (!existsSync(filePath)) {
      return jsonResponse({ ok: false, error: "No leads file found" }, 404);
    }

    const content = await readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/).filter(Boolean);
    
    for (const line of lines) {
      const record = JSON.parse(line) as AuditLeadRecord;
      if (record.id === id) {
        return jsonResponse({ ok: true, data: record });
      }
    }

    return jsonResponse({ ok: false, error: "Lead not found" }, 404);
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}

