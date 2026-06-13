# Audit Prisma — VSCG Platform

## Instrumentation (activée en dev par défaut)

| Variable | Effet |
|----------|--------|
| `LOG_PRISMA_QUERIES=true` | Timing de chaque opération Prisma |
| `LOG_PRISMA_ALL=true` | Log **toutes** les requêtes (pas seulement lentes) |
| `LOG_PRISMA_SQL=true` | Log SQL brut + durée |
| `PRISMA_WARN_MS=300` | Seuil warn (défaut 300) |
| `PRISMA_SLOW_MS=1000` | Seuil error (défaut 1000) |

Logs terminal :
- `[prisma:300ms+] Model.operation 450ms`
- `[prisma:1000ms+] Model.operation 1200ms`

Audit batch local :
```bash
npm run db:audit
```

---

## Problèmes identifiés (avant correctifs)

### P1 — Volume de requêtes par navigation RSC
**Cause** : layout `force-dynamic` + page serveur = 12–20 requêtes/clic.  
**Symptôme** : 4–5 s si RTT BDD élevé (local→Neon ou many round-trips).  
**Fix** : quick wins ci-dessous (−3 à −6 requêtes sur pages lourdes).

### P2 — Permissions coordinateur dupliquées (training page)
**Fichiers** : `permissions.ts`, `training-feed.ts`  
**Requêtes** : 3–4× `userProjectRole.findFirst` (sessions, participants, certificats, feed).  
**Fix** : `getCoordinatorProjectRole()` cache React — **1 requête** partagée.  
**Gain estimé** : −200 à −800 ms (coordinateur).

### P3 — `getActiveCompanyId` double fetch user
**Fichier** : `active-company.ts` (corrigé session précédente)  
**Fix** : `getClientCompanyContext()` depuis user déjà chargé.

### P4 — `certificate.findMany` avec filtre imbriqué
**Fichier** : `trainings/[id]/page.tsx`  
**Requête** : `where: { user: { trainings: { some: … } } }` → join lourd.  
**Fix** : `where: { trainingId }` + `select` ciblé.  
**Gain estimé** : −100 à −400 ms.

### P5 — Double fetch présences certificats
**Fichier** : `trainings/[id]/page.tsx`  
**Requête** : `session.findMany` + nested `participants`.  
**Fix** : `sessionParticipant.findMany` plat.  
**Gain estimé** : −50 à −200 ms.

### P6 — `getCurrentUser` over-fetch
**Fichier** : `get-current-user.ts`  
**Fix** : `select` explicite au lieu de `include` complet.

### P7 — Training sessions `include` large
**Fichier** : `trainings/[id]/page.tsx`  
**Fix** : `select` explicite sur sessions/trainers.

### P8 — Staff accès formation
**Fichier** : `permissions.ts`  
**Fix** : early return internal/staff dans `canAccessTrainingWithProject` (−1–3 requêtes).

---

## Singleton Prisma
**Statut** : OK — `globalThis` en dev et prod (`src/lib/prisma.ts`).

---

## Index (migration `20250613000000_perf_indexes`)
- `sessions(training_id, status)`
- `sessions(trainer_id, start_datetime)`
- `feedbacks(training_id, created_at DESC)`
- `session_trainers(user_id)`

---

## Fichiers modifiés (cette passe)

| Fichier | Changement |
|---------|------------|
| `src/lib/prisma.ts` | Logs 300/1000 ms |
| `src/lib/prisma-instrumentation.ts` | **nouveau** |
| `src/lib/coordinator-project-role.ts` | **nouveau** — cache rôle coordinateur |
| `src/lib/auth/get-current-user.ts` | `select` ciblé |
| `src/lib/permissions.ts` | coordinateur batch + staff fast path |
| `src/lib/training-feed.ts` | `canPublishTrainingFeed` sans requête staff |
| `src/app/(dashboard)/trainings/[id]/page.tsx` | certificats + présences + select |
| `scripts/prisma-audit.mjs` | **nouveau** |
| `prisma/schema.prisma` | retrait `directUrl` (DATABASE_URL seul) |

---

## Comment mesurer après deploy

1. `npm run dev` → naviguer → lire terminal `[prisma:300ms+]`
2. `npm run db:audit` → baseline locale
3. Vercel Preview : `LOG_PRISMA_QUERIES=true` temporaire

---

## Non traité (impact moindre / hors scope)

- `force-dynamic` sur layout (auth/demo — changement risqué)
- Feed posts toujours en Suspense (+1 requête streaming)
- `projects/[id]/page.tsx` gros include (optimisable phase 2)
- `certificate-auto-unlock` boucle séquentielle (hors navigation)
