#!/usr/bin/env bash
set -e

BRANCH="main"
STASHED=0

echo "🚀 Déploiement en cours..."
echo "📂 Dossier actuel : $(pwd)"

# Vérif repo git
if [ ! -d ".git" ]; then
  echo "❌ Pas un repo git"
  exit 1
fi

# Fix Git permission
echo "🔐 Fix safe.directory..."
git config --global --add safe.directory "$(pwd)" || true

# Stash si modifs locales
if [ -n "$(git status --porcelain)" ]; then
  echo "🧳 Stash des modifications locales..."
  git stash push -u -m "auto deploy stash"
  STASHED=1
else
  echo "✅ Pas de modifications locales"
fi

# Pull sécurisé
echo "⬇️ Git pull..."
git pull origin $BRANCH

# ✅ CRITIQUE — uploads doit exister MAIS jamais écrasé
echo "📁 Vérification dossier uploads (SAFE)..."
mkdir -p uploads

# Permissions (important Plesk)
chmod -R 775 uploads || true

# Docker
echo "🐳 Rebuild Docker..."
docker compose up -d --build

# attente services
echo "⏳ Attente..."
sleep 5

# Prisma
echo "🗄️ Prisma migrate..."
docker compose exec app npx prisma migrate deploy || true

# Restore stash
if [ "$STASHED" -eq 1 ]; then
  echo "📦 Restore stash..."
  git stash pop || echo "⚠️ conflit possible"
fi

echo "✅ Déploiement terminé ✅"
