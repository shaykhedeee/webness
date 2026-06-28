import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = "http://localhost:3001/api";

async function runTest() {
  console.log("🧪 Starting Signal Room Integration Test...\n");

  // 1. Log in to get JWT token
  console.log("🔑 Logging in as alex@webness.in...");
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "alex@webness.in",
      password: "password123",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }

  const loginData = (await loginRes.json()) as any;
  const token = loginData.data.token;
  console.log("✅ Logged in successfully. Token acquired.");

  // 2. Fetch clients to find Dr. Jane Clinic
  console.log("\n📁 Fetching clients...");
  const clientsRes = await fetch(`${API_URL}/signal-room/clients`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!clientsRes.ok) {
    throw new Error(`Fetch clients failed: ${clientsRes.status} ${await clientsRes.text()}`);
  }

  const clientsData = (await clientsRes.json()) as any;
  const clients = clientsData.data;
  console.log(`✅ Found ${clients.length} client rooms.`);

  const clinic = clients.find((c: any) => c.name === "Dr. Jane Clinic");
  if (!clinic) {
    throw new Error("Client 'Dr. Jane Clinic' not found in database.");
  }
  console.log(`🎯 Target Client Room: ${clinic.name} (${clinic.id})`);

  // 3. Fetch signals for the room
  console.log("\n📥 Fetching signals for client room...");
  const signalsRes = await fetch(`${API_URL}/signal-room/clients/${clinic.id}/signals`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!signalsRes.ok) {
    throw new Error(`Fetch signals failed: ${signalsRes.status} ${await signalsRes.text()}`);
  }

  const signalsData = (await signalsRes.json()) as any;
  const signals = signalsData.data;
  console.log(`✅ Found ${signals.length} signals in client room.`);

  // 4. Generate AI Report Narrative
  console.log("\n🤖 Generating AI report draft...");
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const generateRes = await fetch(`${API_URL}/signal-room/clients/${clinic.id}/reports/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Weekly Growth & SEO Update",
      periodStart: sevenDaysAgo.toISOString().split("T")[0],
      periodEnd: now.toISOString().split("T")[0],
      signalIds: signals.map((s: any) => s.id),
    }),
  });

  if (!generateRes.ok) {
    throw new Error(`Report generation failed: ${generateRes.status} ${await generateRes.text()}`);
  }

  const generateData = (await generateRes.json()) as any;
  const report = generateData.data;
  console.log(`✅ Report draft created: "${report.title}" (ID: ${report.id})`);
  console.log(`📄 Narrative Summary Headline: "${report.narrative.headline}"`);
  console.log(`💡 Recommended Action Items Count: ${report.narrative.recommendedActions.length}`);

  // 5. Fetch report details with action items
  console.log("\n🔍 Fetching report details...");
  const reportDetailRes = await fetch(`${API_URL}/signal-room/reports/${report.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!reportDetailRes.ok) {
    throw new Error(`Fetch report detail failed: ${reportDetailRes.status} ${await reportDetailRes.text()}`);
  }

  const reportDetailData = (await reportDetailRes.json()) as any;
  const detailedReport = reportDetailData.data;
  console.log(`✅ Report details loaded. Status: ${detailedReport.status}`);
  console.log(`📋 Proposed Action Items in database: ${detailedReport.actionItems.length}`);
  detailedReport.actionItems.forEach((item: any, i: number) => {
    console.log(`   [${i + 1}] "${item.title}" - Status: ${item.status}`);
  });

  // 6. Approve Report and Promote Action Items
  console.log("\n✅ Approving report and promoting tasks...");
  const approveRes = await fetch(`${API_URL}/signal-room/reports/${report.id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!approveRes.ok) {
    throw new Error(`Report approval failed: ${approveRes.status} ${await approveRes.text()}`);
  }

  const approveData = (await approveRes.json()) as any;
  console.log(`✅ Approved. Message: "${approveData.message}"`);

  // 7. Verify Task status in database
  console.log("\n🧐 Verifying promoted task status...");
  const verifiedActionItems = await prisma.actionItem.findMany({
    where: { reportId: report.id },
  });

  let allApproved = true;
  verifiedActionItems.forEach((item) => {
    console.log(`   📌 Task: "${item.title}" -> Status in DB: ${item.status}`);
    if (item.status !== "APPROVED") {
      allApproved = false;
    }
  });

  if (allApproved && verifiedActionItems.length > 0) {
    console.log("\n🎉 SUCCESS: All action items successfully promoted to APPROVED!");
  } else {
    throw new Error("Failure: Some action items were not promoted correctly.");
  }
}

runTest()
  .catch((err) => {
    console.error("\n❌ Test failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
