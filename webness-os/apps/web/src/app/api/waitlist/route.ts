import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

function getWaitlistFilePath() {
  return path.join(process.cwd(), ".data", "waitlist.jsonl");
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email: string };
    if (!email || !email.includes("@")) {
      return Response.json({ error: "Invalid email address." }, { status: 400 });
    }

    const record = {
      email,
      createdAt: new Date().toISOString(),
    };

    const filePath = getWaitlistFilePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    await appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");

    console.log(`[Waitlist] New signup: ${email}`);

    return Response.json({ ok: true, joined: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
