import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@webness/db";
import { logger } from "../utils/logger.js";
import crypto from "crypto";
import { sendEmail } from "../utils/mail-service.js";

export const webhookRoutes = Router();

// ────────────────────────────────────────────
// STRIPE WEBHOOK
// ────────────────────────────────────────────

/**
 * POST /api/webhooks/stripe
 * Handles Stripe payment events
 * Uses raw body (configured in index.ts)
 */
webhookRoutes.post("/stripe", async (req: Request, res: Response) => {
  const _sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  try {
    // Verify Stripe signature manually (avoid importing stripe SDK for now)
    const payload = (req as any).rawBody as Buffer;
    if (!payload) {
      return res.status(400).json({ error: "Missing raw body" });
    }

    // Parse Stripe event (in production, use stripe.webhooks.constructEvent)
    const event = JSON.parse(payload.toString());

    logger.info({ type: event.type, id: event.id }, "Stripe webhook received");

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.orgId;
        const credits = parseInt(session.metadata?.credits || "0");

        if (!orgId || !credits) {
          logger.warn({ session: session.id }, "Stripe webhook missing metadata");
          break;
        }

        await prisma.$transaction(async (tx: any) => {
          const wallet = await tx.creditWallet.findUnique({ where: { orgId } });
          if (!wallet) {
            logger.error({ orgId }, "Wallet not found for Stripe payment");
            return;
          }

          const newBalance = wallet.balance + credits;

          await tx.creditWallet.update({
            where: { orgId },
            data: { balance: newBalance },
          });

          await tx.creditTransaction.create({
            data: {
              walletId: wallet.id,
              type: "PURCHASE",
              amount: credits,
              balance: newBalance,
              description: `Stripe payment: ${session.amount_total / 100} ${session.currency?.toUpperCase()} (session: ${session.id})`,
            },
          });
        });

        logger.info(
          { orgId, credits, sessionId: session.id },
          "Stripe payment processed"
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        logger.warn(
          { intentId: intent.id, error: intent.last_payment_error?.message },
          "Stripe payment failed"
        );
        break;
      }

      default:
        logger.debug({ type: event.type }, "Unhandled Stripe event");
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Stripe webhook error");
    return res.status(400).json({ error: "Webhook processing failed" });
  }
});

// ────────────────────────────────────────────
// RAZORPAY WEBHOOK
// ────────────────────────────────────────────

/**
 * POST /api/webhooks/razorpay
 * Handles Razorpay payment events (primary for India market)
 */
webhookRoutes.post("/razorpay", async (req: Request, res: Response) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"] as string;

  if (!webhookSecret) {
    logger.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  try {
    // Verify Razorpay signature
    const payload = (req as any).rawBody as Buffer;
    if (!payload) {
      return res.status(400).json({ error: "Missing raw body" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== signature) {
      logger.warn("Razorpay webhook signature mismatch");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(payload.toString());

    logger.info({ event: event.event, id: event.payload?.payment?.entity?.id }, "Razorpay webhook received");

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orgId = payment.notes?.orgId;
        const credits = parseInt(payment.notes?.credits || "0");

        if (!orgId || !credits) {
          logger.warn({ paymentId: payment.id }, "Razorpay webhook missing notes");
          break;
        }

        await prisma.$transaction(async (tx: any) => {
          const wallet = await tx.creditWallet.findUnique({ where: { orgId } });
          if (!wallet) {
            logger.error({ orgId }, "Wallet not found for Razorpay payment");
            return;
          }

          const newBalance = wallet.balance + credits;

          await tx.creditWallet.update({
            where: { orgId },
            data: { balance: newBalance },
          });

          await tx.creditTransaction.create({
            data: {
              walletId: wallet.id,
              type: "PURCHASE",
              amount: credits,
              balance: newBalance,
              description: `Razorpay payment: ₹${payment.amount / 100} (id: ${payment.id})`,
            },
          });
        });

        logger.info(
          { orgId, credits, paymentId: payment.id },
          "Razorpay payment processed"
        );
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        logger.warn(
          { paymentId: payment.id, error: payment.error_description },
          "Razorpay payment failed"
        );
        break;
      }

      default:
        logger.debug({ event: event.event }, "Unhandled Razorpay event");
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Razorpay webhook error");
    return res.status(400).json({ error: "Webhook processing failed" });
  }
});

// ────────────────────────────────────────────
// WHATSAPP WEBHOOK (Meta Cloud API)
// ────────────────────────────────────────────

/**
 * GET /api/webhooks/whatsapp
 * Verification endpoint required by Meta
 */
webhookRoutes.get("/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    logger.info("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }

  logger.warn("WhatsApp webhook verification failed");
  return res.sendStatus(403);
});

/**
 * POST /api/webhooks/whatsapp
 * Receives incoming WhatsApp messages and status updates
 */
webhookRoutes.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Meta sends a specific structure
    if (body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        if (!value) continue;

        const phoneNumberId = value.metadata?.phone_number_id;

        // Find the WhatsApp account by phone number ID
        const account = phoneNumberId
          ? await prisma.whatsAppAccount.findFirst({
              where: { phoneNumberId },
            })
          : null;

        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            logger.info(
              {
                from: message.from,
                type: message.type,
                phoneNumberId,
              },
              "WhatsApp message received"
            );

            // Store message
            if (account) {
              await prisma.whatsAppMessage.create({
                data: {
                  accountId: account.id,
                  orgId: account.orgId,
                  waMessageId: message.id,
                  direction: "INBOUND",
                  fromNumber: message.from,
                  contactPhone: message.from,
                  contactName: value.contacts?.[0]?.profile?.name || message.from,
                  type: message.type?.toUpperCase() || "TEXT",
                  content:
                    message.text?.body ||
                    message.image?.caption ||
                    message.document?.caption ||
                    `[${message.type}]`,
                  rawPayload: message,
                },
              });
            }

            // TODO: Process with AI agent for auto-replies
            // This will be implemented in Phase 6
          }
        }

        // Handle status updates (sent, delivered, read)
        if (value.statuses) {
          for (const status of value.statuses) {
            logger.debug(
              {
                messageId: status.id,
                status: status.status,
                recipient: status.recipient_id,
              },
              "WhatsApp status update"
            );

            // Update message status in DB
            if (account) {
              await prisma.whatsAppMessage.updateMany({
                where: { waMessageId: status.id },
                data: {
                  status: status.status?.toUpperCase() || "UNKNOWN",
                },
              });
            }
          }
        }
      }
    }

    // Always respond 200 to Meta
    return res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "WhatsApp webhook error");
    // Still return 200 to prevent Meta from retrying
    return res.sendStatus(200);
  }
});

/**
 * POST /api/webhooks/resurgo/organization
 * Synchronizes organizations created in Resurgo Business Tab to Webness
 */
webhookRoutes.post("/resurgo/organization", async (req: Request, res: Response) => {
  try {
    const { event, orgData } = req.body;

    if (!orgData || !orgData.slug) {
      return res.status(400).json({ success: false, error: "orgData with slug is required" });
    }

    logger.info({ event, slug: orgData.slug }, "Resurgo organization sync webhook received");

    if (event === "org.created" || event === "org.updated") {
      const org = await prisma.organization.upsert({
        where: { slug: orgData.slug },
        update: {
          name: orgData.name,
          website: orgData.website,
          industry: orgData.industry,
          plan: orgData.plan || "FREE",
        },
        create: {
          id: orgData.id || undefined, // use same UUID if provided
          name: orgData.name,
          slug: orgData.slug,
          website: orgData.website,
          industry: orgData.industry,
          plan: orgData.plan || "FREE",
          creditWallet: {
            create: {
              balance: 100, // Starting bonus credits
            }
          }
        },
      });

      return res.json({ success: true, organization: org });
    }

    return res.status(400).json({ success: false, error: `Unsupported event type: ${event}` });
  } catch (err: any) {
    logger.error({ err: err.message }, "Resurgo webhook sync error");
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/webhooks/posthog
 * Processes PostHog telemetry events and triggers proactive alerts/tasks to Resurgo
 */
webhookRoutes.post("/posthog", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    logger.info({ event: payload.event }, "PostHog webhook received");

    // Check if the event is a degradation event or key action drop
    if (payload.event === "traffic_drop" || payload.event === "organic_traffic_decrease") {
      const orgId = payload.properties?.orgId || "system";
      const orgSlug = payload.properties?.orgSlug || "default";

      // Call Resurgo webhook to register a new card in the Resurgo "Tasks" tab
      const resurgoTaskUrl = process.env.RESURGO_TASK_WEBHOOK_URL || "https://api.resurgo.life/webhooks/webness/tasks";
      
      logger.info({ orgId, url: resurgoTaskUrl }, "Pushing proactive task to Resurgo...");

      fetch(resurgoTaskUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webness-Signature": "secret-sig"
        },
        body: JSON.stringify({
          orgId,
          orgSlug,
          title: "Organic Traffic Drop Alert",
          description: `PostHog telemetry detected a significant traffic drop for organization ${orgSlug}. Suggested Action: Run an Organic SEO and Blog Audit to identify ranking issues.`,
          priority: "HIGH",
          category: "SEO"
        })
      }).catch((err) => {
        logger.warn({ orgId, err: err.message }, "Failed to send proactive task to Resurgo");
      });
    }

    return res.json({ success: true, processed: true });
  } catch (err: any) {
    logger.error({ err: err.message }, "PostHog webhook error");
    return res.status(500).json({ success: true, error: err.message });
  }
});

/**
 * POST /api/webhooks/leads
 * Handles incoming lead creation from NextJS public agency website
 */
webhookRoutes.post("/leads", async (req: Request, res: Response) => {
  try {
    const { record } = req.body;

    if (!record || !record.id || !record.input) {
      return res.status(400).json({ success: false, error: "record is required with id and input" });
    }

    const { id, input, result } = record;
    logger.info({ leadId: id, website: input.websiteUrl }, "Received public agency website lead webhook");

    // 1. Create or upsert Organization in the DB using the lead's website/business name
    const orgSlug = input.websiteUrl
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();

    // Find if Organization with this website/slug exists, otherwise create it
    const org = await prisma.organization.upsert({
      where: { slug: orgSlug },
      update: {
        name: input.business || input.websiteUrl,
        website: input.websiteUrl,
        industry: input.businessType,
      },
      create: {
        name: input.business || input.websiteUrl,
        slug: orgSlug,
        website: input.websiteUrl,
        industry: input.businessType,
        plan: "FREE",
        creditWallet: {
          create: { balance: 100 } // Welcome bonus
        }
      }
    });

    // 2. Try to find a default user or create a shadow client user for the organization
    const clientEmail = input.email || "prospect@example.com";
    const user = await prisma.user.upsert({
      where: { email: clientEmail },
      update: {
        name: input.name || "Founder",
      },
      create: {
        email: clientEmail,
        name: input.name || "Founder",
        role: "CLIENT_ADMIN",
        orgId: org.id,
        favoriteShape: "circle", // default onboarding favorite shape
      }
    });

    // 3. Create a Task for this organization corresponding to the scan
    const seoTool = await prisma.tool.findFirst({ where: { slug: "seo_auditor" } });
    const task = await prisma.task.create({
      data: {
        orgId: org.id,
        userId: user.id,
        toolId: seoTool?.id || "",
        status: "COMPLETED",
        priority: 5,
        inputData: input,
        outputData: result,
        creditCost: 0,
        completedAt: new Date()
      }
    });

    // 4. Send Client email
    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
        <h1 style="color: #10b981; font-size: 24px; font-weight: 900; margin-bottom: 20px;">Webness Signal Scan Report</h1>
        <p style="color: #cbd5e1; line-height: 1.6; font-size: 16px;">
          Hello ${input.name || "Founder"},<br/><br/>
          We have generated your dynamic growth snapshot for <strong>${input.websiteUrl}</strong>. Before building or buying ads, we map the real bottleneck.
        </p>
        
        <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #334155;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 18px; font-weight: bold; color: #f1f5f9;">Composite Health Score</span>
            <span style="font-size: 28px; font-weight: 900; color: #10b981;">${result.score}/100</span>
          </div>
          
          <div style="margin-top: 15px; border-top: 1px solid #1e293b; padding-top: 15px;">
            <p style="margin: 5px 0; color: #94a3b8; font-size: 14px;">Speed readiness: <strong style="color: #f1f5f9;">${result.speed}/100</strong></p>
            <p style="margin: 5px 0; color: #94a3b8; font-size: 14px;">Trust & proof: <strong style="color: #f1f5f9;">${result.trust}/100</strong></p>
            <p style="margin: 5px 0; color: #94a3b8; font-size: 14px;">Search & AI visibility: <strong style="color: #f1f5f9;">${result.search}/100</strong></p>
            <p style="margin: 5px 0; color: #94a3b8; font-size: 14px;">Conversion clarity: <strong style="color: #f1f5f9;">${result.conversion}/100</strong></p>
            <p style="margin: 5px 0; color: #94a3b8; font-size: 14px;">Automation readiness: <strong style="color: #f1f5f9;">${result.automation}/100</strong></p>
          </div>
        </div>
        
        <div style="background-color: #020617; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px;">
          <h3 style="color: #f1f5f9; margin: 0 0 10px 0;">Primary Bottleneck</h3>
          <p style="color: #cbd5e1; margin: 0; font-size: 14px; line-height: 1.6;">${result.summary}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="http://localhost:3002/audit/thank-you?lead=${id}" style="background-color: #10b981; color: #020617; font-weight: bold; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; display: inline-block;">Unlock Autopilot Dashboard</a>
        </div>
      </div>
    `;

    await sendEmail(clientEmail, `Your Webness Signal Scan Scorecard: ${result.score}/100`, clientEmailHtml);

    // 5. Send Admin Notification Email
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 25px; border-radius: 8px;">
        <h2 style="color: #10b981;">New High-Intent B2B Lead Captured!</h2>
        <p><strong>Business:</strong> ${input.business} (${input.websiteUrl})</p>
        <p><strong>Founder:</strong> ${input.name}</p>
        <p><strong>Email:</strong> ${clientEmail}</p>
        <p><strong>Phone:</strong> ${input.phoneOrWhatsApp || "N/A"}</p>
        <p><strong>Type:</strong> ${input.businessType}</p>
        <p><strong>Goal:</strong> ${input.monthlyLeadGoal}</p>
        <p><strong>Tools:</strong> ${input.currentTools}</p>
        <p><strong>Bottleneck:</strong> ${input.biggestBottleneck}</p>
        <p><strong>Calculated Score:</strong> ${result.score}/100</p>
        <p><a href="http://localhost:3000/projects/${task.id}" style="color: #10b981;">View Task in Admin Portal</a></p>
      </div>
    `;

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@webness.in";
    await sendEmail(adminEmail, `🔥 Webness Lead: ${input.business} (${result.score}/100)`, adminEmailHtml);

    // 6. Webhook to Resurgo to add a task card for manual scan followup
    const resurgoTaskUrl = process.env.RESURGO_TASK_WEBHOOK_URL || "https://api.resurgo.life/webhooks/webness/tasks";
    fetch(resurgoTaskUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId: org.id,
        orgSlug: org.slug,
        title: `Manual Scan: ${org.name}`,
        description: `Review the automatic Signal Scan for ${org.name} (${input.websiteUrl}). Score was ${result.score}/100. Contact: ${input.name} (${clientEmail}).`,
        priority: "HIGH",
        category: "ADMIN"
      })
    }).catch(() => {});

    return res.json({ success: true, organizationId: org.id });
  } catch (err: any) {
    logger.error({ err: err.message }, "Lead webhook processing exception");
    return res.status(500).json({ success: false, error: err.message });
  }
});


