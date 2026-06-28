import { checkBrainHealth } from "../utils/circuit-breaker.js";
import { logger } from "../utils/logger.js";

let monitorInterval: ReturnType<typeof setInterval> | null = null;
let lastStatus: "online" | "offline" = "offline";
let consecutiveFailures = 0;

const CHECK_INTERVAL = 30000; // 30 seconds
const ALERT_THRESHOLD = 5;   // Alert after 5 consecutive failures (2.5 min)

/**
 * Monitor the Cloudflare Tunnel connection to the Local Brain
 * Runs every 30s and logs status changes
 */
export function startTunnelMonitor(): void {
  logger.info("🔗 Tunnel monitor started (checking every 30s)");

  monitorInterval = setInterval(async () => {
    const healthy = await checkBrainHealth();

    if (healthy) {
      if (lastStatus === "offline") {
        logger.info("🟢 Brain tunnel ONLINE — connection restored");
      }
      lastStatus = "online";
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;

      if (lastStatus === "online") {
        logger.warn("🔴 Brain tunnel OFFLINE — connection lost");
      }

      if (consecutiveFailures === ALERT_THRESHOLD) {
        logger.error(
          { downtime: `${(consecutiveFailures * CHECK_INTERVAL) / 1000}s` },
          "⚠️ Brain tunnel DOWN for extended period — tasks will queue"
        );
        // TODO: Send notification (email/WhatsApp alert to admin)
      }

      lastStatus = "offline";
    }
  }, CHECK_INTERVAL);
}

/**
 * Stop the tunnel monitor
 */
export function stopTunnelMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    logger.info("Tunnel monitor stopped");
  }
}

/**
 * Get current tunnel status
 */
export function getTunnelStatus() {
  return {
    status: lastStatus,
    consecutiveFailures,
    downtimeSeconds: lastStatus === "offline" ? consecutiveFailures * (CHECK_INTERVAL / 1000) : 0,
  };
}
