# Migrations Prisma

## Prod déjà créée avec `db push` (baseline)

```bash
npx prisma migrate resolve --applied 20250612000000_init
```

## Dev — nouvelle migration

```bash
npm run db:migrate
```

## Prod — apply migrations

```bash
npm run db:migrate:deploy
```
