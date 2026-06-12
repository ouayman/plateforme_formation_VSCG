#!/usr/bin/env bash
# Bootstrap VPS vierge
#
# Sur VPS vide :
#   apt update && apt install -y git
#   git clone https://github.com/ouayman/plateforme_formation_VSCG.git /opt/vsc-platform
#   cd /opt/vsc-platform
#   export VSCG_DB_PASSWORD='...'
#   sudo -E bash deploy/bootstrap-vps.sh
set -euo pipefail

APP_DIR="/opt/vsc-platform"
REPO_URL="${REPO_URL:-https://github.com/ouayman/plateforme_formation_VSCG.git}"
DB_USER="${DB_USER:-vscg}"
DB_NAME="${DB_NAME:-vsc_platform}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez avec sudo."
  exit 1
fi

if [ -z "${VSCG_DB_PASSWORD:-}" ]; then
  echo "Définissez le mot de passe BDD avant de lancer :"
  echo "  export VSCG_DB_PASSWORD='votre_mot_de_passe'"
  echo "  sudo -E bash deploy/bootstrap-vps.sh"
  exit 1
fi

echo "== 1/8 Outils =="
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql postgresql-contrib

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

npm install -g pm2

echo "== 2/8 PostgreSQL =="
systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${VSCG_DB_PASSWORD}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo "== 3/8 Clone repo =="
mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "== 4/8 .env requis =="
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/deploy/.env.production.example" "$APP_DIR/.env"
  echo ""
  echo "Fichier $APP_DIR/.env créé depuis l'exemple."
  echo "Éditez-le (JWT_SECRET, SMTP_PASS, DATABASE_URL avec le même mot de passe BDD)."
  echo "Puis relancez : sudo -E bash deploy/bootstrap-vps.sh"
  exit 0
fi

echo "== 5/8 Dossiers =="
mkdir -p "$APP_DIR/logs" "$APP_DIR/uploads" "$APP_DIR/backups"
chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" "$APP_DIR" 2>/dev/null || true

echo "== 6/8 npm install =="
cd "$APP_DIR"
npm install

echo "== 7/8 BDD (migrations Prisma uniquement) =="
npx prisma generate
npx prisma migrate deploy

echo "== 8/8 Build + PM2 =="
npm run build
pm2 delete vscg 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "${SUDO_USER:-root}" --hp "/root" 2>/dev/null || pm2 startup

echo "== Nginx (HTTP) =="
cp "$APP_DIR/deploy/nginx.http.conf" /etc/nginx/sites-available/vscg
ln -sf /etc/nginx/sites-available/vscg /etc/nginx/sites-enabled/vscg
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "Bootstrap OK."
echo "  App : pm2 status"
echo "  HTTPS : certbot --nginx -d formation.valuestream-consulting.com"
echo "  Seed (optionnel) : cd $APP_DIR && npm run db:seed"
