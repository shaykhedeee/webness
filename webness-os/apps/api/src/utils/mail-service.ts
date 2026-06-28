import { logger } from "./logger.js";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Webness <noreply@resurgo.life>";

  if (!apiKey) {
    logger.warn("RESEND_API_KEY is not configured. Email will be logged only.");
    logger.info({ to, subject }, "Simulated Email Sent");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ error: errorText, to, subject }, "Failed to send email via Resend");
      return false;
    }

    const data = await response.json();
    logger.info({ data, to, subject }, "Email sent successfully via Resend");
    return true;
  } catch (err: any) {
    logger.error({ err: err.message, to, subject }, "Resend email delivery exception");
    return false;
  }
}
