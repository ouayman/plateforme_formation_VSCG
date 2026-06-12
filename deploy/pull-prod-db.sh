#!/usr/bin/env bash
# Production → local DB only. Never pushes local DB to production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/deploy/.env.deploy}"
FRESH=false

for arg in "$@"; do
  case "$arg" in
    --fresh) FRESH=true ;;
    -h|--help)
      echo "Usage: bash deploy/pull-prod-db.sh [--fresh]"
      echo "  --fresh  drop + recreate local DB before restore"
      exit 0
      ;;
  esac
done

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

VPS_HOST="${VPS_HOST:?VPS_HOST requis}"
VPS_USER="${VPS_USER:?VPS_USER requis}"
VPS_APP_DIR="${VPS_APP_DIR:-/opt/vsc-platform}"
SSH_KEY_PATH="${SSH_KEY_PATH:-}"
LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/vsc_platform?schema=public}"
PROD_DB_USER="${PROD_DB_USER:-vscg}"
PROD_DB_NAME="${PROD_DB_NAME:-vsc_platform}"

SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [ -n "$SSH_KEY_PATH" ]; then
  SSH_OPTS+=(-i "$SSH_KEY_PATH")
fi

DUMP_LOCAL="$ROOT/deploy/tmp/prod_dump_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p "$(dirname "$DUMP_LOCAL")"

echo "⚠️  Ceci remplace votre BDD LOCALE par une copie de la PROD."
read -r -p "Continuer ? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Annulé."
  exit 0
fi

echo "→ dump prod sur VPS..."
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" \
  "pg_dump -U '$PROD_DB_USER' -d '$PROD_DB_NAME' | gzip" > "$DUMP_LOCAL"

echo "→ dump local: $DUMP_LOCAL"

LOCAL_DB_NAME="$(echo "$LOCAL_DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')"
LOCAL_DB_USER="$(echo "$LOCAL_DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')"

if [ "$FRESH" = true ]; then
  echo "→ --fresh : drop local DB $LOCAL_DB_NAME..."
  dropdb -U "$LOCAL_DB_USER" --if-exists "$LOCAL_DB_NAME" || true
  createdb -U "$LOCAL_DB_USER" "$LOCAL_DB_NAME"
fi

echo "→ restore local..."
gunzip -c "$DUMP_LOCAL" | psql "$LOCAL_DATABASE_URL" >/dev/null

echo "→ prisma generate..."
cd "$ROOT" && npx prisma generate

echo "✅ BDD locale synchronisée depuis prod"
