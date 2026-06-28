import { prisma } from "@webness/db";
import { logger } from "../utils/logger.js";

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
const RUN_INTERVAL = 60000; // Run every 60 seconds

/**
 * Background daemon to calculate and log organization digital health scores dynamically
 */
async function calculateAllHealthScores(): Promise<void> {
  try {
    logger.info("📊 Health Telemetry Scheduler: Recalculating all client health scores...");

    const activeOrgs = await prisma.organization.findMany({
      where: { isActive: true },
    });

    for (const org of activeOrgs) {
      try {
        // 1. Fetch completed tasks for dynamic score calculation
        const [seoTasks, contentTasks, socialPostsCount] = await Promise.all([
          prisma.task.findMany({
            where: {
              orgId: org.id,
              tool: { slug: "seo_auditor" },
              status: "COMPLETED",
            },
            take: 5,
            orderBy: { completedAt: "desc" },
          }),
          prisma.task.count({
            where: {
              orgId: org.id,
              tool: { slug: "blog_writer" },
              status: "COMPLETED",
            },
          }),
          prisma.socialPost.count({
            where: {
              account: { orgId: org.id },
              status: "PUBLISHED",
            },
          }),
        ]);

        // 2. Calculate dynamic metrics based on task outputs
        let seoScore = 70; // Baseline default
        let speedScore = 80; // Baseline default

        if (seoTasks.length > 0) {
          let totalSeo = 0;
          let totalSpeed = 0;
          let count = 0;

          for (const task of seoTasks) {
            const output = (task.outputData as Record<string, any>) || {};
            const scores = output.scores || {};
            if (typeof scores.technical === "number" || typeof scores.performance === "number") {
              totalSeo += scores.technical ?? 70;
              totalSpeed += scores.performance ?? 80;
              count++;
            }
          }

          if (count > 0) {
            seoScore = Math.round(totalSeo / count);
            speedScore = Math.round(totalSpeed / count);
          }
        }

        // Content score scales with completed blog writing tasks
        const contentScore = Math.min(100, Math.max(30, contentTasks * 20));

        // Social score scales with published social media posts
        const socialScore = Math.min(100, Math.max(40, socialPostsCount * 15));

        // Lead generation score based on outreach / whatsapp templates
        const whatsappMsgCount = await prisma.whatsAppMessage.count({
          where: { orgId: org.id, direction: "OUTBOUND" },
        });
        const leadScore = Math.min(100, Math.max(40, whatsappMsgCount * 8));

        // Composite overall score
        const overallScore = Math.round(
          (seoScore * 0.3) +
          (contentScore * 0.25) +
          (speedScore * 0.2) +
          (socialScore * 0.15) +
          (leadScore * 0.1)
        );

        // 3. Write telemetry record
        await prisma.clientHealthScore.create({
          data: {
            orgId: org.id,
            overallScore,
            seoScore,
            contentScore,
            speedScore: speedScore,
            socialScore,
            leadScore,
            uptimeScore: 99, // Static simulated uptime
            alertTriggered: overallScore < 50,
            alertMessage: overallScore < 50 ? `Digital Health score degraded below warning threshold (${overallScore}/100)` : null,
          },
        });

        // 4. Sync score with Resurgo via Webhook
        const resurgoWebhookUrl = process.env.RESURGO_WEBHOOK_URL || "https://api.resurgo.life/webhooks/webness/health";
        if (resurgoWebhookUrl) {
          fetch(resurgoWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webness-Signature": "secret-sig"
            },
            body: JSON.stringify({
              orgId: org.id,
              orgSlug: org.slug,
              overallScore,
              seoScore,
              contentScore,
              speedScore,
              socialScore,
              leadScore,
              alertTriggered: overallScore < 50,
              measuredAt: new Date().toISOString()
            })
          }).catch((err) => {
            logger.warn({ orgId: org.id, err: err.message }, "Resurgo health sync webhook failed");
          });
        }

        logger.info(
          { orgId: org.id, orgName: org.name, overallScore, seoScore, contentScore },
          "✓ Client HealthScore calculated and logged successfully"
        );
      } catch (err: any) {
        logger.error(
          { orgId: org.id, orgName: org.name, err: err.message },
          "Failed to calculate health score for organization"
        );
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "Global Health Telemetry calculation failure");
  }
}

/**
 * Start the background health scores updater scheduler
 */
export function startHealthScheduler(): void {
  logger.info("📊 Health Telemetry Scheduler started");
  
  // Run once immediately on start
  calculateAllHealthScores().catch(() => {});

  schedulerInterval = setInterval(async () => {
    await calculateAllHealthScores();
  }, RUN_INTERVAL);
}

/**
 * Stop the health scores updater scheduler
 */
export function stopHealthScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info("Health Telemetry Scheduler stopped");
  }
}
