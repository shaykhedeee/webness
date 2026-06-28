import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Signal Room test data...\n");

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: "webness" },
    update: {},
    create: {
      name: "Webness Agency",
      slug: "webness",
      plan: "PRO",
    },
  });
  console.log(`✅ Organization created/found: ${org.name} (${org.id})`);

  // 2. Create Credit Wallet if not exists
  const wallet = await prisma.creditWallet.upsert({
    where: { orgId: org.id },
    update: {},
    create: {
      orgId: org.id,
      balance: 500,
    },
  });
  console.log(`✅ Credit wallet balance: ${wallet.balance}`);

  // 3. Create User (Password: password123, pre-hashed using bcrypt)
  const passwordHash = "$2a$12$bRNqeYqldfXaobMfqSH.2OVob5szdUOgiJ/gJlocE0QZ26PHLyECW";
  const user = await prisma.user.upsert({
    where: { email: "alex@webness.in" },
    update: { passwordHash },
    create: {
      email: "alex@webness.in",
      name: "Alex Webness",
      passwordHash,
      role: "CLIENT_ADMIN",
      orgId: org.id,
    },
  });
  console.log(`✅ User created/found: ${user.name} (${user.email})`);

  // 4. Create Client Room
  // First, check if ClientRoom already exists for this organization
  let clientRoom = await prisma.clientRoom.findFirst({
    where: { name: "Dr. Jane Clinic", orgId: org.id },
  });

  if (!clientRoom) {
    clientRoom = await prisma.clientRoom.create({
      data: {
        orgId: org.id,
        name: "Dr. Jane Clinic",
        website: "https://drjaneclinic.com",
        industry: "Healthcare & Medicine",
        goals: [
          "Increase local SEO rankings",
          "Improve page speed score to >90",
          "Generate 50 monthly patient inquiries"
        ],
        reportCadence: "weekly",
        brandTone: [
          "Professional",
          "Empathic",
          "Informative",
          "Clear"
        ],
      },
    });
    console.log(`✅ Client Room created: ${clientRoom.name} (${clientRoom.id})`);
  } else {
    console.log(`⏭️ Client Room: ${clientRoom.name} already exists`);
  }

  // 5. Create Signals
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const signalsData = [
    {
      orgId: org.id,
      clientRoomId: clientRoom.id,
      source: "gsc",
      title: "Google Search Console Clicks & Impressions (Last 7 days)",
      value: { clicks: 185, impressions: 3200, averagePosition: 12.4 },
      periodStart: sevenDaysAgo,
      periodEnd: now,
    },
    {
      orgId: org.id,
      clientRoomId: clientRoom.id,
      source: "ga4",
      title: "Google Analytics 4 Session Traffic & Engagement",
      value: { sessions: 450, conversions: 12, bounceRate: 48.5 },
      periodStart: sevenDaysAgo,
      periodEnd: now,
    },
    {
      orgId: org.id,
      clientRoomId: clientRoom.id,
      source: "pagespeed",
      title: "PageSpeed Insights Audit - Homepage",
      value: { mobileScore: 72, desktopScore: 91, largestContentfulPaint: 2.8 },
      periodStart: now,
      periodEnd: now,
    },
    {
      orgId: org.id,
      clientRoomId: clientRoom.id,
      source: "manual",
      title: "Weekly Completed Checklist Items",
      value: { notes: "Successfully optimized local schema markup, resolved broken internal links on the resources directory, and drafted the patient booking page update." },
      periodStart: sevenDaysAgo,
      periodEnd: now,
    },
  ];

  // Only create signals if none exist for this client room
  const existingSignalsCount = await prisma.signal.count({
    where: { clientRoomId: clientRoom.id },
  });

  if (existingSignalsCount === 0) {
    for (const sig of signalsData) {
      await prisma.signal.create({ data: sig });
    }
    console.log(`✅ Seeded ${signalsData.length} signals for ${clientRoom.name}`);
  } else {
    console.log(`⏭️ Signals already exist for ${clientRoom.name}`);
  }

  console.log("\n🎉 Signal Room seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
