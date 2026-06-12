#!/usr/bin/env bash
# Sauvegarde PostgreSQL — cron : 0 3 * * *
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/vsc-platform}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Charger DATABASE_URL depuis .env si présent
if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi

DB_NAME="${DB_NAME:-vsc_platform}"
DB_USER="${DB_USER:-vscg}"

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT="$BACKUP_DIR/vsc_platform_${TIMESTAMP}.sql.gz"

pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$OUTPUT"
find "$BACKUP_DIR" -name "vsc_platform_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[backup] $OUTPUT"
