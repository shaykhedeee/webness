import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { toolsRoutes } from "./routes/tools.routes.js";
import { byokRoutes } from "./routes/byok.routes.js";
import { projectsRoutes } from "./routes/projects.routes.js";
import { creditsRoutes } from "./routes/credits.routes.js";
import { startSSEPubSub, streamRoutes } from "./routes/stream.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { webhookRoutes } from "./routes/webhook.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { aiOsRoutes } from "./routes/ai-os.routes.js";
import { vaultRoutes } from "./routes/vault.routes.js";
import { advisorRoutes } from "./routes/advisor.routes.js";
import { apiKeysRoutes } from "./routes/api-keys.routes.js";
import { signalRoomRoutes } from "./routes/signal-room.routes.js";
import { sceneBranchingRoutes } from "./routes/scene-branching.routes.js";
import { oodaRoutes } from "./routes/ooda.routes.js";
import { hermesRoutes } from "./routes/hermes.routes.js";
import { legalAiRoutes } from "./routes/legal-ai.routes.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// ---- Security ----
app.use(
  helmet({
    contentSecurityPolicy: false, // Dashboard handles its own CSP
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ---- Global Rate Limit ----
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, error: "Too many requests. Slow down." },
  })
);

// ---- Body Parsing ----
// Webhooks need raw body for signature verification
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// ---- Request Logging ----
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "incoming request");
  next();
});

// ---- Routes ----
app.use("/api/health", healthRoutes);
app.use("/api/ai-os", aiOsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/byok", byokRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/credits", creditsRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/advisor", advisorRoutes);
app.use("/api/client-api-keys", apiKeysRoutes);
app.use("/api/signal-room", signalRoomRoutes);
app.use("/api/scene-branches", sceneBranchingRoutes);
app.use("/api/ooda", oodaRoutes);
app.use("/api/hermes", hermesRoutes);
app.use("/api/legal", legalAiRoutes);

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ---- Global Error Handler ----
app.use(errorHandler);

startSSEPubSub();

// ---- Start Server ----
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Webness API running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
