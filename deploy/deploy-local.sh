#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/deploy/.env.deploy}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

VPS_HOST="${VPS_HOST:?VPS_HOST requis (deploy/.env.deploy)}"
VPS_USER="${VPS_USER:?VPS_USER requis}"
VPS_APP_DIR="${VPS_APP_DIR:-/opt/vsc-platform}"
GIT_BRANCH="${GIT_BRANCH:-main}"
SSH_KEY_PATH="${SSH_KEY_PATH:-}"

SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [ -n "$SSH_KEY_PATH" ]; then
  SSH_OPTS+=(-i "$SSH_KEY_PATH")
fi

cd "$ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Changements non commités. Committez avant deploy."
  git status -sb
  exit 1
fi

echo "→ git push origin $GIT_BRANCH..."
git push origin "$GIT_BRANCH"

echo "→ SSH deploy sur $VPS_USER@$VPS_HOST..."
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" \
  "cd '$VPS_APP_DIR' && bash deploy/deploy.sh"

echo "✅ Deploy local terminé"
