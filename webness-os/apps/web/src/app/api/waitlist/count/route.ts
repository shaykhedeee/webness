import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

function getWaitlistFilePath() {
  return path.join(process.cwd(), ".data", "waitlist.jsonl");
}

export async function GET() {
  try {
    const filePath = getWaitlistFilePath();
    let count = 0;

    if (existsSync(filePath)) {
      const content = await readFile(filePath, "utf8");
      count = content.split(/\r?\n/).filter(Boolean).length;
    }

    // Baseline count of 42 to show active interest
    return Response.json({ count: 42 + count });
  } catch (err: any) {
    return Response.json({ count: 42 });
  }
}
