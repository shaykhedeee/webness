#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Webness OS — Deploy Script
# Run on VPS: bash deploy.sh
# ─────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="/home/webness/webness-os"
LOG_FILE="/home/webness/logs/deploy-$(date +%Y%m%d_%H%M%S).log"

echo "🚀 Webness OS — Deploying..." | tee -a "${LOG_FILE}"

cd "${APP_DIR}"

# ─── Pull Latest ───────────────────────────────────────────
echo "📥 Pulling latest changes..." | tee -a "${LOG_FILE}"
git pull origin main 2>&1 | tee -a "${LOG_FILE}"

# ─── Install Dependencies ─────────────────────────────────
echo "📦 Installing dependencies..." | tee -a "${LOG_FILE}"
pnpm install --frozen-lockfile 2>&1 | tee -a "${LOG_FILE}"

# ─── Generate Prisma Client ───────────────────────────────
echo "🔧 Generating Prisma client..." | tee -a "${LOG_FILE}"
pnpm db:generate 2>&1 | tee -a "${LOG_FILE}"

# ─── Run Migrations ───────────────────────────────────────
echo "🗃️ Running database migrations..." | tee -a "${LOG_FILE}"
pnpm db:migrate 2>&1 | tee -a "${LOG_FILE}"

# ─── Build All ─────────────────────────────────────────────
echo "🏗️ Building all packages..." | tee -a "${LOG_FILE}"
pnpm build 2>&1 | tee -a "${LOG_FILE}"

# ─── Restart Services ─────────────────────────────────────
echo "♻️ Restarting PM2 processes..." | tee -a "${LOG_FILE}"
pm2 reload ecosystem.config.cjs --update-env 2>&1 | tee -a "${LOG_FILE}"
pm2 save 2>&1 | tee -a "${LOG_FILE}"

# ─── Health Check ──────────────────────────────────────────
echo "🏥 Running health check..." | tee -a "${LOG_FILE}"
sleep 5

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")

if [ "${HTTP_STATUS}" = "200" ]; then
  echo "✅ Deploy successful! API is healthy (HTTP ${HTTP_STATUS})" | tee -a "${LOG_FILE}"
else
  echo "⚠️ API health check returned HTTP ${HTTP_STATUS}" | tee -a "${LOG_FILE}"
  echo "   Check logs: pm2 logs webness-api" | tee -a "${LOG_FILE}"
fi

echo "" | tee -a "${LOG_FILE}"
echo "Deploy log: ${LOG_FILE}"
