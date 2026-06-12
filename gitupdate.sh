#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/ouayman/plateforme_formation_VSCG.git"
DEFAULT_BRANCH="main"

if [ -z "${1:-}" ]; then
  echo "❌ Erreur : tu dois fournir un message de commit."
  echo '👉 Exemple : sh gitupdate.sh "fix: correction bug login"'
  exit 1
fi

COMMIT_MSG="$1"

echo "📂 Dossier courant : $(pwd)"

# 1) Vérifier que gh est installé
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) n'est pas installé."
  echo "👉 Installe-le d'abord, puis relance ce script."
  exit 1
fi

# 2) Vérifier connexion GitHub
if ! gh auth status >/dev/null 2>&1; then
  echo "🔐 Pas connecté à GitHub. Lancement de l'authentification navigateur..."
  gh auth login --web
fi

# 3) Vérifier qu'on est bien dans un repo git
if [ ! -d ".git" ]; then
  echo "❌ Erreur : ce dossier n'est pas un repo Git."
  exit 1
fi

# 4) Vérifier/ajouter le remote origin
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "🔗 Aucun remote 'origin' trouvé. Ajout du dépôt distant..."
  git remote add origin "$REPO_URL"
else
  CURRENT_REMOTE="$(git remote get-url origin)"
  echo "✅ Remote origin existant : $CURRENT_REMOTE"
fi

echo "📡 Remotes configurés :"
git remote -v

# 5) Forcer la branche locale sur main si besoin
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
if [ -z "$CURRENT_BRANCH" ]; then
  echo "❌ Impossible de déterminer la branche courante."
  exit 1
fi

if [ "$CURRENT_BRANCH" != "$DEFAULT_BRANCH" ]; then
  echo "🔀 Renommage de la branche locale '$CURRENT_BRANCH' vers '$DEFAULT_BRANCH'..."
  git branch -M "$DEFAULT_BRANCH"
fi

# 6) Ajouter tous les fichiers AVANT pull/rebase
echo "➕ Ajout des fichiers..."
git add .

# 7) Commit si changements
if git diff --cached --quiet; then
  echo "ℹ️ Aucun changement local à commit."
else
  echo "✅ Commit..."
  git commit -m "$COMMIT_MSG"
fi

# 8) Mettre à jour depuis le remote
if git ls-remote --heads origin "$DEFAULT_BRANCH" | grep -q "$DEFAULT_BRANCH"; then
  echo "⬇️ Fetch des dernières modifications..."
  git fetch origin "$DEFAULT_BRANCH"

  echo "🔄 Rebase sur origin/$DEFAULT_BRANCH..."
  git rebase "origin/$DEFAULT_BRANCH"
else
  echo "ℹ️ La branche distante '$DEFAULT_BRANCH' n'existe pas encore. Premier push probable."
fi

# 9) Push
echo "🚀 Push vers GitHub..."
git push -u origin "$DEFAULT_BRANCH"

echo "✅ Terminé ✅"