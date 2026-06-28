import { randomUUID } from "node:crypto";
import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const VALID_SLUGS = ["playbook", "seo-checklist", "prompt-pack"];

const SLUG_TO_FILE: Record<string, { filename: string; url: string }> = {
  "playbook": {
    filename: "sovereign-ai-playbook.md",
    url: "/downloads/sovereign-ai-playbook.md",
  },
  "seo-checklist": {
    filename: "webness-seo-readiness.md",
    url: "/downloads/webness-seo-readiness.md",
  },
  "prompt-pack": {
    filename: "sovereign-ai-skills.json",
    url: "/downloads/sovereign-ai-skills.json",
  },
};

function getLeadsFilePath() {
  return (
    process.env.WEBNESS_RESOURCE_LEADS_FILE ||
    path.join(process.cwd(), ".data", "resources-leads.jsonl")
  );
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  let payload: { email?: string; resourceSlug?: string };

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "Request body must be valid JSON." }, 400);
  }

  const { email, resourceSlug } = payload;

  // Validate inputs
  if (!email || !email.trim() || !email.includes("@")) {
    return jsonResponse({ success: false, error: "A valid email address is required." }, 400);
  }

  if (!resourceSlug || !VALID_SLUGS.includes(resourceSlug)) {
    return jsonResponse({ success: false, error: "A valid resource choice is required." }, 400);
  }

  const resourceInfo = SLUG_TO_FILE[resourceSlug];

  const leadRecord = {
    id: `lead_${Date.now()}_${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    email: email.trim().toLowerCase(),
    resourceSlug,
    filename: resourceInfo.filename,
    meta: {
      userAgent: request.headers.get("user-agent") || "unknown",
      referer: request.headers.get("referer") || "direct",
    },
  };

  // Securely write lead logging to local JSONL data file
  try {
    const filePath = getLeadsFilePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    await appendFile(filePath, `${JSON.stringify(leadRecord)}\n`, "utf8");

    return jsonResponse({
      success: true,
      stored: true,
      id: leadRecord.id,
      downloadUrl: resourceInfo.url,
      filename: resourceInfo.filename,
    });
  } catch (err: any) {
    // Graceful error recovery: still allow the download to proceed even if file writes are temporarily locked
    return jsonResponse({
      success: true,
      stored: false,
      id: leadRecord.id,
      downloadUrl: resourceInfo.url,
      filename: resourceInfo.filename,
      warning: "Download authorized, but logging storage was unavailable.",
    });
  }
}
