# Baseline perf — Phase 0

## Mesure locale

```bash
npm run perf:routes    # timings SQL par route P0
npm run db:audit       # requêtes unitaires
```

Seuils : `PRISMA_WARN_MS=300`, `PRISMA_SLOW_MS=1000`.

Preview Vercel (temporaire) : `LOG_PRISMA_QUERIES=true`

---

## Contrats JSON — non-régression

Ces shapes ne doivent **pas** changer sans validation métier explicite.

### `GET /api/auth/demo-users`

```json
[
  {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "type": "internal | client",
    "companyName": "string",
    "globalRoles": ["ADMIN", "PLANNER", "TRAINER"],
    "projectRoles": [{ "role": "COORDINATOR", "projectName": "string" }],
    "isParticipant": true
  }
]
```

### `/projects` — props `ProjectsList`

```json
{
  "activeProjects": [{
    "id": "string",
    "name": "string",
    "startDate": "ISO8601",
    "endDate": "ISO8601",
    "deletedAt": "ISO8601 | null",
    "company": { "name": "string" },
    "_count": { "programs": 0 }
  }],
  "deletedProjects": "[] même shape",
  "canManageDeleted": true
}
```

### `/trainings/[id]` — props clés `TrainingFeedView`

Champs obligatoires côté UI (non exhaustif) :

- `trainingId`, `programId`, `title`, `programName`
- `sessions[]` : `id`, `startDatetime`, `endDatetime`, `status`, `locationName`, `trainers`, `attendanceStatus`
- `canPublish`, `canModerate`, `canManageSessions`, `canManageCertificates`, `canManageParticipants`
- `showFeedbackPanel`, `canSubmitFeedback`, `allFeedbacks[]`, `certificateStatus`
- `initialCertificates[]`, `initialAvailableParticipants[]` (via Provider)
- `progress` : `sessionProgress`, `attendanceProgress`, `completedSessions`, `totalSessions`, `attendedSessions`

### `GET /api/users` (staff)

```json
[{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "type": "string",
  "companyId": "string",
  "company": { "id": "string", "name": "string", "type": "string" },
  "globalRoles": [{ "role": "string" }]
}]
```

---

## Routes P0 — budget requêtes cible (Phase 1)

| Route | Requêtes max (hors auth layout) | Notes |
|-------|----------------------------------|-------|
| `/api/auth/demo-users` | 2 parallèles | users + orgName cache |
| `/projects` | 2–3 | list + deleted + companies |
| `/trainings/[id]` | 1 + batch parallèle | permissions en // avec access |
| `/projects/[id]` | 1 + access | detail unique ; editor data en // si staff |
| `/sessions/[id]` | 1 + access | select explicite ; pas de 2e fetch projet |
| Layout dashboard | 3 | user + roles + settings (Phase 2) |

---

## Phase 1 appliquée

- Cache `getCachedOrganizationName()` pour API routes
- Loaders `src/lib/loaders/training-detail.ts`, `projects-list.ts`
- `include` → `select` sur routes P1
- `api/users` : `take` + `select`

Phase 2 : lazy onglets program (Suspense), cache trainers + platform settings, auth parallèle.

## Phase 2 appliquée

- `src/lib/loaders/program-detail.ts` — core + participants/feedbacks lazy
- Suspense : `ProgramParticipantsPanel`, `ProgramFeedbacksPanel`
- `getCachedPlatformSettings()` — layout dashboard (TTL 60 s)
- `getCachedTrainersList()` — page formation (TTL 60 s)
- `getCurrentUser` — user + projectRoles en parallèle

Phase 3 : planning loader, vues SQL agrégats si volume réel.

## Phase 3 appliquée

- `src/lib/loaders/planning.ts` — staff / trainer / participant
- Planning participant : requête légère (sans certificats/feedbacks/posts)
- `getParticipantTrainings` : `include` → `select` (my-trainings)
- `loadTrainingAttachmentCounts()` — agrégat SQL documents programme
- `verifyTrainerPlanningAccess()` — contrôle accès centralisé

Phase 4 (optionnel) : fenêtre temporelle planning staff si volume extrême, cache sessions par mois.

## Phase 4 appliquée

- `src/lib/loaders/project-detail.ts` — `loadProjectDetail` + `loadProjectEditorData`
- `canAccessProjectWithSnapshot()` — contrôle accès sans 2e `project.findUnique`
- `getCachedClientCompanies()` — TTL 60 s (`/projects`, formulaire projet)
- Stats projet / planning — loaders dédiés en `Promise.all` où pertinent
- `/sessions/[id]` : `include` → `select` + accès via snapshot projet chargé

## Loaders uniformisés (dashboard)

Toutes les pages `(dashboard)/**/page.tsx` délèguent les requêtes à `src/lib/loaders/` :

| Loader | Route |
|--------|-------|
| `admin-users.ts` | `/admin/users` |
| `admin-participants.ts` | `/admin/participants` |
| `admin-companies.ts` | `/admin/companies` |
| `admin-skill-domains.ts` | `/admin/skill-domains` |
| `admin-settings.ts` | `/admin/settings` |
| `admin-trainers.ts` | `/admin/trainers` |
| `account.ts` | `/account` |
| `session-detail.ts` | `/sessions/[id]` |
| `my-trainings.ts` | `/my-trainings` |
| (+ loaders phases 1–3 : projects, training, planning, programme, dashboard) |

## Phase P1 appliquée

- `getCurrentUser()` — sans jointure `companies` pour staff/internal
- `loadTrainingPageData()` — accès + permissions + secondary en 3 vagues max (vs 4+)
- `deriveTrainingPagePermissions()` / `resolveTrainingPageAccess()` — 1 seul fetch coordinateur
- Layout : instrumentation Prisma `[prisma:request] dashboard-layout`

## Phase P2 client (lazy modals admin)

Réduction du JS initial / hydratation sur pages admin et formulaires projet :

- `src/components/features/admin/lazy-modals.tsx` — `dynamic()` + `ssr: false` pour modals Radix
- `src/components/features/projects/lazy-modals.tsx` — `ProjectFormModal`, `ProgramEditButton`
- Pages : `/admin/trainers`, `/companies`, `/users`, `/participants`, `/skill-domains`, `/settings`
- Tables client : `users-admin-table`, `participants-admin-table`, `skill-domains-admin-table`

Les modals ne sont chargés qu’au montage client (boutons d’action) ; le HTML serveur reste identique (fallback 8×8 px).

## Phase P3 client + dev

- `src/components/features/programs/lazy-modals.tsx` — programme / formation
- Extension `projects/lazy-modals.tsx` — lieux, signataires, rôles projet, delete
- Pages lourdes : `project-detail-tabs`, `program-detail-tabs`, `training-cards`, `training-sessions-manager`, `project-team-section`, `program-participants-table`
- Dev : `npm run dev:turbo` ou `DEV_TURBO=1 npm run dev` (compile Next.js plus rapide en local)

## Phase P4 API (select explicite)

Routes API : `include` → `select` sur champs réellement renvoyés au client :

- `account`, `users`, `users/[id]`, `projects`, `projects/[id]`
- `projects/[id]/roles`, `admin/trainers`, `admin/trainers/[id]`
- `programs/.../participants`, `programs/.../feedbacks`
- `trainings/.../participants`, `trainings/.../certificates`
- `sessions/.../attendance`, `sessions/.../report`
- `demo-users` : retrait logs debug timing
