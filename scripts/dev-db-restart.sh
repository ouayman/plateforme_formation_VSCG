#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/.."

echo "→ Arrêt du serveur dev..."
npm run dev:stop

echo "→ Génération Prisma..."
npm run db:generate

echo "→ Push schéma BDD..."
npm run db:push

echo "→ Seed BDD..."
npm run db:seed

echo "→ Démarrage du serveur dev..."
npm run dev
