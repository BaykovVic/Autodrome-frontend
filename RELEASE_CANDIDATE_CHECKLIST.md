# Frontend Release Candidate Checklist

Pilot rollout / deploy hand-off checklist для
`Autodrome-frontend`.

Артефакт. Никаких runtime code changes — checklist
ссылается на gates и состояния, уже шипнутые в develop.

## Build & test gates

Run from repo root:

```bash
pnpm install --frozen-lockfile
pnpm contracts:check          # 9 client services aligned
pnpm contracts:generate       # regenerate types if needed
pnpm lint                     # 0 errors (preexisting warnings unrelated)
pnpm typecheck
pnpm test                     # 715 unit tests
pnpm build                    # production Next.js build
pnpm e2e                      # 163 chromium tests (mock-mode)
```

Bundled: `pnpm release-gate`.

iCloud safety (run before commits + before e2e):

```bash
find . -name "* 2.*" -type f -delete
rm -rf .next tsconfig.tsbuildinfo
```

## Runtime mode matrix

| Mode | env | Loaders | Use |
| --- | --- | --- | --- |
| mock (default) | `NEXT_PUBLIC_API_ADAPTER` unset / non-`live` | fixtures | dev, CI, pilot demo |
| mock + scenario | `NEXT_PUBLIC_MOCK_SCENARIO=violations-detected` etc. | scenario-keyed fixtures | demoing specific UI states |
| live | `NEXT_PUBLIC_API_ADAPTER=live` | typed clients via `createLiveAdapter` | production / staging |
| live + per-service override | `NEXT_PUBLIC_API_<SERVICE>_BASE_URL` | per-service routing | hybrid environments |

Per-service env keys в `src/api/runtime-config.ts`.

## Registered backend services (9)

`candidate`, `vehicle`, `exam`, `exercise`, `violation-rule`,
`media-archive`, `android-device-management`,
`virtual-vehicle`, `reporting-document`.

All wired via:
- `contracts.config.json` (canonical OpenAPI pointer);
- `src/contracts/types/<service>.ts` (generated types);
- `src/api/services/<service>.ts` (typed client);
- `src/api/adapter.ts` / `src/api/live.ts` /
  `src/api/mock/adapter.ts` / `src/api/runtime-config.ts`
  (registry).

## Known degraded states (RC blockers / advisories)

### Blocked backend contracts (4 features held for backend)

| Feature | Status | Reason |
| --- | --- | --- |
| `frontend-virtual-vehicle-telemetry-live-binding` | BLOCKED | No canonical OpenAPI for `vehicle-telemetry-service` (proto-only ingest). |
| `frontend-operations-health-live-integration` | BLOCKED | No canonical contract for ops/health aggregator. |
| `frontend-diagnostics-live-integration` | BLOCKED | No canonical contract for diagnostics collection. |
| `frontend-backup-restore-live-integration` | BLOCKED | No canonical contract for backup/restore. |

Blocked-report files в `Управление реализацией/reports/feature/`.

### Honest degraded surfaces (UI behaves correctly)

- **Evidence detail / unknown id**: honest not-found note,
  no invented refs.
- **Virtual vehicle session monitor / unknown sessionId**:
  empty runtime + event log surfaces.
- **Manual control / unknown sessionId**: unknown banner +
  disabled controls.
- **Runtime preview / unknown sessionId**: unknown banner +
  suppressed pose.
- **Media playback / export**: persistently disabled
  affordances + 5-token degraded-state taxonomy
  (`recordingMetadataAvailable` / `storageUnavailable` /
  `manifestUnavailable` / `exportUnavailable` /
  `retentionChecksumIssue`).
- **Reporting generate / export**: disabled affordances
  с explicit tooltip ссылающимся на pending features.
- **Operations backups / restore**: surface reachable,
  destructive actions never auto-executed in tests.

## Tech debt (acknowledged, not shipped)

- `scenarioLabel` в VV workspace mapper равен `scenarioId`
  пока scenario catalog resolution не подключён в same
  session.
- VV session monitor использует reverse-lookup через
  `/virtual-vehicles` пока не появится top-level
  `/sessions/{sessionId}` resolver.
- Evidence detail base record мокается (canonical
  `evidence-service` HTTP read model отсутствует).
- Reporting recent reports table: frontend держит
  curated reportIds, нет canonical
  `/reports?examId=` list endpoint.
- `_adapter` / `_examId` / `_update` warnings в
  candidates / exams / exercises / rules live loaders
  (placeholder для будущих mutation paths).

## Deploy artifact hand-off

Output из `pnpm build`:

- `.next/` standalone build directory.
- Routes (33+ shipped):
  - Static: `/dashboard`, `/candidates`, `/candidates/new`,
    `/vehicles`, `/exams`, `/exercises`, `/rules`,
    `/violations`, `/devices`, `/evidence`, `/reporting`,
    `/operations`, `/virtual-vehicles`,
    `/virtual-vehicles/scenarios`.
  - Dynamic: `/candidates/sessions/[sessionId]`,
    `/candidates/sessions/[sessionId]/camera-station`,
    `/capture/[sessionId]`, `/evidence/[evidenceId]`,
    `/virtual-vehicles/sessions/[sessionId]`,
    `/virtual-vehicles/sessions/[sessionId]/manual-control`,
    `/virtual-vehicles/sessions/[sessionId]/runtime-preview`.

Hand-off:
- Передавать `.next/` + `package.json` + `pnpm-lock.yaml`.
- Стартовать через `pnpm start` (Next.js standalone) или
  containerise через official Next.js Dockerfile.

## Rollback notes

- `master` ветка содержит только bootstrap commits
  (`Initial commit`, `Project created`). Не двигать без
  явного разрешения Victor Baykov.
- `develop` — основная live ветка; merged features
  идут сюда через `--no-ff` merges.
- Rollback одной фичи: `git revert -m 1 <merge-commit>`
  на develop branch (НЕ rebase / reset published merges).
- Hot rollback всего release: `git checkout <prior-merge>
  -- .` + новый commit (preserves history).
- iCloud cleanup перед любым commit / push:
  `find . -name "* 2.*" -type f -delete`.

## Shipped tracks (this RC)

| Track | Status | Features merged | Reports |
| --- | --- | --- | --- |
| 1 — Heartbeat reconciliation | shipped | 1 | 1 |
| 2 — Virtual Vehicle workspace | shipped | 5 | 5 |
| 3 — Virtual Vehicle live API | shipped F1; F2 blocked | 1 + 1 blocked | 2 |
| 4 — Evidence / media / reporting | shipped | 5 | 5 |
| 5 — Operations | F4 shipped; F1/F2/F3 blocked | 1 + 3 blocked | 4 |
| 6 — Pilot E2E + hardening | shipped F1–F7 | 7 (включая bundled F2/F3/F4) | 7 |
| 7 — Autodrome design follow-up | not started | 0 | 0 |

Track 6 / F7 — этот checklist.

## Sign-off

- [ ] `pnpm release-gate` зелёный на target commit.
- [ ] iCloud sweep выполнен.
- [ ] Mode matrix (mock/live) подтверждён environment
  ops engineer.
- [ ] Blocked features подтверждены backend team (4
  blocker contracts).
- [ ] Rollback plan (`git revert -m 1`) подтверждён
  release engineer.
