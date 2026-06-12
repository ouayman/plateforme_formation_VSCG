# VSCG Platform

Plateforme de gestion des formations — Next.js · Prisma · PostgreSQL

## Démarrage rapide

```bash
git clone https://github.com/ouayman/plateforme_formation_VSCG.git
cd plateforme_formation_VSCG
cp .env.example .env
# éditer .env (secrets, SMTP)
docker compose up -d --build
```

Application : http://localhost:3000

Première install — seed :

```bash
docker compose exec app npx prisma db seed
```

## Local avec emails de test (Mailpit)

```bash
docker compose --profile dev up -d --build
```

Dans `.env` :

```env
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURE=false
```

Mailpit UI : http://localhost:8025

## Mise à jour

```bash
git pull
docker compose up -d --build
```

## Commandes utiles

Voir [docs/COMMANDS.md](docs/COMMANDS.md)

## Production

- Port exposé : **3000** (reverse proxy / Plesk → HTTPS)
- BDD persistante : volume Docker `postgres_data`
- Fichiers uploadés : volume Docker `uploads_data`
- Prisma Studio : ponctuel uniquement, jamais exposé publiquement
