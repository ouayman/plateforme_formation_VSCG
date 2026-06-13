# Migrations Prisma

## Prod déjà créée avec `db push` (baseline)

```bash
npx prisma migrate resolve --applied 20250612000000_init
```

Variables Neon sur Vercel : `DATABASE_URL` uniquement (URL pooler + `pgbouncer=true` recommandé).

## Dev — nouvelle migration

```bash
npm run db:migrate
```

## Prod — apply migrations

```bash
npm run db:migrate:deploy
```

Le build Vercel (`vercel-build`) exécute `prisma migrate deploy` automatiquement.

## Index perf (20250613000000_perf_indexes)

- `sessions(training_id, status)` — listes sessions formation
- `sessions(trainer_id, start_datetime)` — planning formateur
- `feedbacks(training_id, created_at DESC)` — avis par formation
- `session_trainers(user_id)` — sessions multi-formateurs
