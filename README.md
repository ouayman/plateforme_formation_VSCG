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

En dev (`NODE_ENV=development`), les emails passent par SMTP → Mailpit.

```bash
docker compose --profile dev up -d --build
```

Dans `.env` :

```env
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM="Value Stream Consulting <noreply@localhost>"
```

Mailpit UI : http://localhost:8025

## Production (Resend)

En production et **Preview Vercel** (`NODE_ENV=production`), les emails passent par l’API Resend — une seule fonction `sendEmail()` côté code métier.

Variables Vercel :

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=formation@valuestream-consulting.com
RESEND_FROM_NAME=Value Stream Consulting
RESEND_REPLY_TO=formation@valuestream-consulting.com
```

Couche : `src/lib/email/` (providers Resend / SMTP selon `NODE_ENV`).

## Mise à jour

```bash
git pull
docker compose up -d --build
```

## Commandes utiles

Voir [docs/COMMANDS.md](docs/COMMANDS.md)

## Production

- **Emails** : Resend en prod + Preview Vercel (`RESEND_*`). Local : Mailpit via SMTP (`SMTP_*`). Abstraction : `src/lib/email` → `sendEmail()`.
- **Vercel** : fichiers via Blob store (private, proxy `/api/media` et routes métier). Local : `vercel env pull` → `BLOB_READ_WRITE_TOKEN`. Préfixe store : `STORAGE_ENV` ou `VERCEL_ENV`.
- **Docker** : port **3000**, volume `uploads_data`, backend disque local automatique si pas de token Blob.
- BDD persistante : volume Docker `postgres_data` ou Neon sur Vercel
- Prisma Studio : ponctuel uniquement, jamais exposé publiquement
