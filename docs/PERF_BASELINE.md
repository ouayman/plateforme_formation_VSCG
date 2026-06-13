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
- `src/lib/loaders/dashboard.ts` — stats tableau de bord en `Promise.all`
- `/sessions/[id]` : `include` → `select` + accès via snapshot projet chargé
