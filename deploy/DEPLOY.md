# Déploiement SSH manuel — sans Docker prod, sans CI/CD

## Setup local (une fois)

```bash
cp deploy/.env.deploy.example deploy/.env.deploy
# éditer deploy/.env.deploy
chmod +x deploy/deploy-local.sh deploy/pull-prod-db.sh
ssh-keygen -t ed25519 -f ~/.ssh/vscg_deploy -N ""
# clé publique → VPS ~/.ssh/authorized_keys
```

## Deploy prod

```bash
git add . && git commit -m "..." && bash deploy/deploy-local.sh
```

Flow : `git push` → SSH → `deploy/deploy.sh` sur VPS

## Remote deploy (sur VPS)

```bash
cd /opt/vsc-platform && bash deploy/deploy.sh
```

Étapes : pull → npm ci → **backup BDD** → `prisma migrate deploy` → build → pm2 restart

**Jamais** `db push` en prod. **Jamais** sync local → prod.

## BDD prod déjà existante (db push avant migrations)

Sur le VPS, une fois :

```bash
cd /opt/vsc-platform
npx prisma migrate resolve --applied 20250612000000_init
```

Puis deploy normal.

## Pull prod → local

```bash
bash deploy/pull-prod-db.sh          # merge dans BDD locale
bash deploy/pull-prod-db.sh --fresh  # drop + recreate local
```

Prérequis local : Postgres accessible (Docker `npm run docker:up`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `deploy/deploy-local.sh` | push Git + SSH deploy |
| `deploy/deploy.sh` | deploy remote |
| `deploy/pull-prod-db.sh` | prod → local |
| `deploy/.env.deploy` | config locale (gitignored) |
| `ecosystem.config.cjs` | PM2 |
| `deploy/nginx.conf` | Nginx |

## Première install VPS (vierge)

```bash
export VSCG_DB_PASSWORD='mot_de_passe_fort'
sudo -E bash deploy/bootstrap-vps.sh
```

Sans `.env` → crée l'exemple, éditez `/opt/vsc-platform/.env`, relancez.
BDD via `prisma migrate deploy` uniquement.

HTTPS : `certbot --nginx -d formation.valuestream-consulting.com`
