#!/usr/bin/env bash
set -Eeuo pipefail

BRANCH="main"
ENV_FILE=".env"
STASHED=0

# Valeurs par défaut
DEFAULT_POSTGRES_ADMIN_USER="postgres"
DEFAULT_POSTGRES_ADMIN_DB="postgres"
DEFAULT_APP_DB_USER="appuser"
DEFAULT_APP_DB_NAME="appdb"

echo "🚀 Déploiement en cours..."
echo "📂 Dossier actuel : $(pwd)"

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

require_repo() {
  if [ ! -d ".git" ]; then
    echo "❌ Erreur : ce dossier n'est pas un repo Git"
    exit 1
  fi
}

ensure_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️ .env absent → création..."
    touch "$ENV_FILE"
    chmod 600 "$ENV_FILE" || true
  fi
}

load_env() {
  set +u
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE" 2>/dev/null || true
  set +a
  set -u
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 64 | tr -dc 'A-Za-z0-9' | head -c 32
  else
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32
  fi
}

upsert_env() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "$ENV_FILE"; then
    awk -v k="$key" -v v="$value" -F= '
      BEGIN { done=0 }
      $1 == k { print k "=" v; done=1; next }
      { print }
      END { if (done==0) print k "=" v }
    ' "$ENV_FILE" > "${ENV_FILE}.tmp"
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

kill_port_5432_if_used() {
  echo "🔍 Vérification du port 5432 côté hôte..."
  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:5432 -sTCP:LISTEN >/dev/null 2>&1; then
      echo "⚠️ Port 5432 occupé → arrêt forcé..."
      lsof -tiTCP:5432 -sTCP:LISTEN | xargs -r kill -9 || true
      sleep 1
    else
      echo "✅ Port 5432 libre"
    fi
  else
    echo "ℹ️ lsof absent → vérification du port ignorée"
  fi
}

wait_for_postgres() {
  local admin_user="$1"
  local admin_db="$2"
  local max_retries=30
  local count=0

  echo "⏳ Attente disponibilité PostgreSQL..."
  until docker compose exec -T db pg_isready -U "$admin_user" -d "$admin_db" -q; do
    count=$((count + 1))
    if [ "$count" -ge "$max_retries" ]; then
      echo "❌ PostgreSQL n'est pas prêt après ${max_retries} tentatives"
      exit 1
    fi
    echo "   tentative ${count}/${max_retries}..."
    sleep 2
  done
  echo "✅ PostgreSQL accepte les connexions"
}

ensure_pg_role_exists() {
  local admin_user="$1"
  local admin_db="$2"
  local app_user="$3"
  local app_password="$4"

  local exists
  exists="$(docker compose exec -T db psql -U "$admin_user" -d "$admin_db" -tAc "SELECT 1 FROM pg_roles WHERE rolname='${app_user}'" | tr -d '[:space:]' || true)"

  if [ "$exists" = "1" ]; then
    echo "✅ Utilisateur PostgreSQL déjà existant : $app_user"
  else
    echo "👤 Création de l'utilisateur PostgreSQL : $app_user"
    docker compose exec -T db psql -U "$admin_user" -d "$admin_db" -v ON_ERROR_STOP=1 -c "CREATE USER \"${app_user}\" WITH PASSWORD '${app_password}';"
    echo "✅ Utilisateur PostgreSQL créé : $app_user"
  fi
}

ensure_pg_database_exists() {
  local admin_user="$1"
  local admin_db="$2"
  local app_db="$3"
  local app_user="$4"

  local exists
  exists="$(docker compose exec -T db psql -U "$admin_user" -d "$admin_db" -tAc "SELECT 1 FROM pg_database WHERE datname='${app_db}'" | tr -d '[:space:]' || true)"

  if [ "$exists" = "1" ]; then
    echo "✅ Base PostgreSQL déjà existante : $app_db"
  else
    echo "🗄️ Création de la base PostgreSQL : $app_db"
    docker compose exec -T db psql -U "$admin_user" -d "$admin_db" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${app_db}\" OWNER \"${app_user}\";"
    echo "✅ Base PostgreSQL créée : $app_db"
  fi
}

# -------------------------------------------------------------------
# Début
# -------------------------------------------------------------------

require_repo

echo "🔐 Autorisation Git safe.directory..."
git config --global --add safe.directory "$(pwd)" || true

# stash uniquement les fichiers trackés/stagés
# (pas de -u → on ne touche jamais aux fichiers non trackés comme uploads/)
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "🧳 Modifications trackées détectées → stash automatique..."
  git stash push -m "auto deploy stash $(date '+%Y-%m-%d %H:%M:%S')"
  STASHED=1
else
  echo "✅ Pas de modifications trackées à stasher"
fi

echo "⬇️ Git pull..."
git pull origin "$BRANCH"

if [ "$STASHED" -eq 1 ]; then
  echo "📦 Restauration du stash..."
  git stash pop || echo "⚠️ Conflit possible après stash pop → vérifier avec git status"
fi

# uploads : SAFE uniquement
echo "📁 Vérification dossier uploads (SAFE)..."
mkdir -p uploads
chmod 775 uploads || true

# -------------------------------------------------------------------
# Préparation .env
# -------------------------------------------------------------------

echo "🔍 Vérification du fichier .env..."
ensure_env_file
load_env

# Variables admin du conteneur PostgreSQL
POSTGRES_USER="${POSTGRES_USER:-$DEFAULT_POSTGRES_ADMIN_USER}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(random_secret)}"
POSTGRES_DB="${POSTGRES_DB:-$DEFAULT_POSTGRES_ADMIN_DB}"

# Variables de la base applicative
APP_DB_USER="${APP_DB_USER:-$DEFAULT_APP_DB_USER}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-$(random_secret)}"
APP_DB_NAME="${APP_DB_NAME:-$DEFAULT_APP_DB_NAME}"

DATABASE_URL="${DATABASE_URL:-postgresql://${APP_DB_USER}:${APP_DB_PASSWORD}@db:5432/${APP_DB_NAME}}"

upsert_env "POSTGRES_USER" "$POSTGRES_USER"
upsert_env "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
upsert_env "POSTGRES_DB" "$POSTGRES_DB"
upsert_env "APP_DB_USER" "$APP_DB_USER"
upsert_env "APP_DB_PASSWORD" "$APP_DB_PASSWORD"
upsert_env "APP_DB_NAME" "$APP_DB_NAME"
upsert_env "DATABASE_URL" "$DATABASE_URL"

chmod 600 "$ENV_FILE" || true

echo "🔄 Rechargement complet du .env..."
unset POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB APP_DB_USER APP_DB_PASSWORD APP_DB_NAME DATABASE_URL || true
load_env

: "${POSTGRES_USER:?POSTGRES_USER manquant après génération}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD manquant après génération}"
: "${POSTGRES_DB:?POSTGRES_DB manquant après génération}"
: "${APP_DB_USER:?APP_DB_USER manquant après génération}"
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD manquant après génération}"
: "${APP_DB_NAME:?APP_DB_NAME manquant après génération}"
: "${DATABASE_URL:?DATABASE_URL manquant après génération}"

echo "✅ Variables DB prêtes"
echo "   - POSTGRES_USER=$POSTGRES_USER"
echo "   - POSTGRES_DB=$POSTGRES_DB"
echo "   - APP_DB_USER=$APP_DB_USER"
echo "   - APP_DB_NAME=$APP_DB_NAME"
echo "   - DATABASE_URL définie"

# -------------------------------------------------------------------
# PostgreSQL réel sur le VPS / dans le container db
# -------------------------------------------------------------------

kill_port_5432_if_used

echo "🐘 Démarrage du service DB..."
docker compose up -d db

wait_for_postgres "$POSTGRES_USER" "$POSTGRES_DB"
ensure_pg_role_exists "$POSTGRES_USER" "$POSTGRES_DB" "$APP_DB_USER" "$APP_DB_PASSWORD"
ensure_pg_database_exists "$POSTGRES_USER" "$POSTGRES_DB" "$APP_DB_NAME" "$APP_DB_USER"

# -------------------------------------------------------------------
# Application
# -------------------------------------------------------------------

echo "🐳 Rebuild / démarrage de l'application..."
docker compose up -d --build

echo "⏳ Attente démarrage services..."
sleep 5

echo "🗄️ Prisma migrate..."
docker compose exec -T app npx prisma migrate deploy || echo "⚠️ Prisma migrate a échoué ou l'app n'est pas encore prête"

echo "✅ Déploiement terminé ✅"