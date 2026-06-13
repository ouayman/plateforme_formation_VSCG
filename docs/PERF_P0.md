# P0 — Mesure TTFB prod locale

## Lancer

```bash
npm run dev:stop          # libérer le port 3000
npm run build && npm run start
npm run perf:p0           # autre terminal
```

Variables optionnelles : `BASE_URL`, `TTFB_WARN_MS` (500), `TTFB_SLOW_MS` (1500).

Prérequis : `DEMO_MODE=true`, base seedée (`npm run db:seed`).

## Navigateur (complément)

Chrome → Network → document → comparer **Waiting (TTFB)** vs **DOMContentLoaded**.

| Cas | Conclusion |
|-----|------------|
| TTFB warm > 500 ms | P1 serveur (trainings loader, user layout…) |
| TTFB ok, DOMContentLoaded lent | P2 client (modals, bundle) |

Résultats script : sortie console `npm run perf:ttfb`.
