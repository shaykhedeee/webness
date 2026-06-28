#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Webness OS — Database Backup Script
# Schedule via cron: 0 2 * * * /home/webness/webness-os/infra/scripts/backup-db.sh
# ─────────────────────────────────────────────────────────

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────
BACKUP_DIR="/home/webness/backups/db"
DB_NAME="webness_db"
DB_USER="webness"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# ─── Backup ────────────────────────────────────────────────
echo "[$(date)] Starting backup: ${DB_NAME}"

pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --verbose \
  | gzip > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup complete: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ─── Cleanup Old Backups ──────────────────────────────────
echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo "[$(date)] Backups remaining: ${BACKUP_COUNT} (${TOTAL_SIZE} total)"

# ─── Optional: Upload to R2/S3 ────────────────────────────
# Uncomment and configure if you want off-site backups
#
# if command -v rclone &> /dev/null; then
#   rclone copy "${BACKUP_FILE}" r2:webness-backups/db/ --progress
#   echo "[$(date)] Uploaded to R2"
# fi

echo "[$(date)] Backup script finished"
