#!/usr/bin/env bash
# Remote deploy — VPS only. Never syncs local DB to production.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/vsc-platform}"
cd "$APP_DIR"

if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi

DB_USER="${DB_USER:-vscg}"
DB_NAME="${DB_NAME:-vsc_platform}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
GIT_BRANCH="${GIT_BRANCH:-main}"

echo "=========================================="
echo " VSCG deploy — $(date -Iseconds)"
echo "=========================================="

echo "→ git pull origin $GIT_BRANCH..."
git fetch origin "$GIT_BRANCH"
git checkout "$GIT_BRANCH"
git pull origin "$GIT_BRANCH"

echo "→ npm ci (production)..."
npm ci --omit=dev

echo "→ backup BDD avant migration..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre_deploy_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
echo "   backup: $BACKUP_FILE"

echo "→ prisma generate..."
npx prisma generate

echo "→ prisma migrate deploy..."
npx prisma migrate deploy

echo "→ build..."
npm run build

echo "→ pm2 restart..."
pm2 restart vscg || pm2 start ecosystem.config.cjs
pm2 save

echo "→ health check..."
if curl -sf "http://127.0.0.1:3000/api/health" >/dev/null; then
  echo "✅ Deploy OK — health OK"
else
  echo "⚠️  Deploy terminé mais health check échoué"
  exit 1
fi
