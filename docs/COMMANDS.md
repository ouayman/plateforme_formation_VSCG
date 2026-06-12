# Commandes Docker — VSCG Platform

cd /var/www/vhosts/formation.valuestream-consulting.com/httpdocs
chmod +x deploy.sh

git remote add origin https://github.com/ouayman/plateforme_formation_VSCG.git


git remote -v

git add .

git commit -m "update"

git push




## Démarrage

```bash
cp .env.example .env
# éditer .env

# Production / serveur
docker compose up -d --build

# Local avec Mailpit (emails OTP de test)
docker compose --profile dev up -d --build
docker compose --profile dev up -d db mailpit 
npm run dev

docker compose down --remove-orphans
docker compose --profile dev up -d db mailpit

```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Application |
| http://localhost:8025 | Mailpit (profil `dev` uniquement) |

## Mise à jour

```bash
git pull
docker compose up -d --build
```

## Arrêt

```bash
docker compose down
```

Conteneurs orphelins (ex. ancien `postgres` renommé en `db`) :

```bash
docker compose down --remove-orphans
```

⚠️ Ne jamais utiliser `docker compose down -v` en prod (efface la BDD).

## Logs

```bash
docker compose logs -f app
docker compose logs -f db
```

## Migrations Prisma

Appliquées automatiquement au démarrage de `app`.

Manuel :

```bash
docker compose exec app npx prisma migrate deploy
```

## Seed (première install)

```bash
docker compose exec app npx prisma db seed
```

## Prisma Studio (admin ponctuel — jamais public)

Accès local temporaire (fermer avec Ctrl+C) :

```bash
docker compose run --rm -p 127.0.0.1:5555:5555 app \
  npx prisma studio --hostname 0.0.0.0 --port 5555 --browser none
```

Puis ouvrir : http://localhost:5555

En prod sur le VPS : utiliser SSH tunnel, ne pas exposer le port 5555 publiquement.

## Shell PostgreSQL

```bash
docker compose exec db psql -U postgres -d vsc_platform
```

## Rebuild complet

```bash
docker compose up -d --build --force-recreate
```

## SMTP

| Environnement | SMTP_HOST | SMTP_PORT |
|---------------|-----------|-----------|
| Local + Mailpit | `mailpit` | `1025` |
| Production | SMTP réel (IONOS…) | `465` ou `587` |

Même code applicatif — seul le `.env` change.

## HTTPS / domaine

L'app écoute sur le port **3000**. Le reverse proxy (Plesk, Nginx, etc.) pointe vers `http://127.0.0.1:3000`.
