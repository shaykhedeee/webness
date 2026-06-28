import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const filePath =
  process.env.WEBNESS_AUDIT_LEADS_FILE ||
  path.join(process.cwd(), ".data", "audit-leads.jsonl");

if (!existsSync(filePath)) {
  console.log(`No audit leads found at ${filePath}`);
  process.exit(0);
}

const rows = readFileSync(filePath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

if (rows.length === 0) {
  console.log(`No audit leads found at ${filePath}`);
  process.exit(0);
}

console.table(
  rows
    .slice()
    .reverse()
    .map((lead) => ({
      createdAt: lead.createdAt,
      website: lead.input?.websiteUrl,
      email: lead.input?.email,
      businessType: lead.input?.businessType,
      location: lead.input?.targetLocation,
      score: lead.result?.score,
      priority: lead.result?.priority,
      id: lead.id,
    }))
);
