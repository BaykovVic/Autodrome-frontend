# Autodrome Frontend

Frontend repository для проекта Autodrome — локального offline-first продукта
автодрома.

## Статус

Next.js / TypeScript app shell для operator/admin консоли с design
system baseline, pointer на canonical contracts, typed API client
baseline, mock adapter + сценарные fixtures, единым набором common
states/errors primitives и первым прикладным экраном —
`Local node dashboard` (`/dashboard`), который тянет данные через
`getApiAdapter()` (по умолчанию — live, в dev режиме переключается
на mock через env). Пока не подключены: live backend integration
вне dashboard, доменные workspaces под candidate/vehicle/exam/etc.,
auth/session management, формы и таблицы с реальными доменными
данными, deploy artifacts. Все недостающее будет добавлено
последующими фичами согласно документам в `Управление реализацией/`
корневого репозитория проекта.

## Структура приложения

App Router с route group `(shell)`:

- `src/app/page.tsx` — серверный redirect `/` → `/dashboard`.
- `src/app/tokens.css` — semantic CSS-токены (colors, spacing,
  typography, borders, focus, density), импортируется в
  `globals.css`.
- `src/app/(shell)/layout.tsx` — общий shell layout (sidebar + topbar
  + content area, light/dark, responsive). Topbar показывает
  `StatusBadge` из design system.
- `src/app/(shell)/_components/SidebarNav.tsx` — client component
  навигации с активным маршрутом через `usePathname()`.
- `src/app/(shell)/_components/RoutePlaceholder.tsx` — серверный
  компонент для одинаковых placeholder-страниц.
- `src/app/(shell)/<route>/page.tsx` — 9 маршрутов: `dashboard`,
  `candidates`, `vehicles`, `exams`, `exercises`, `violations`,
  `rules`, `evidence`, `operations`. `/dashboard` использует
  `LocalNodeDashboard` — Autodrome Console dashboard поверх
  `useConsoleDashboard` hook'а и mock/data-adapter layer'а
  (`defaultConsoleDashboardLoader` читает scenario-keyed
  fixtures из `consoleDashboardFixtures.ts`). На странице
  шесть widgets: Service health (per-service status badges),
  Database readiness (schema state + WAL/sessions/vacuum),
  Media storage (used/total + segmented bar + healthy/watch/
  degraded summary), Vehicle telemetry (4 tiles + stale note),
  Outbox / event backlog (counter + sparkline + live/paused
  status), Node operations (uptime/backup/sync/env). Перед
  гридом — DashboardHeader (Local Node Dashboard + node/site/
  last-refresh + Refresh кнопка) и опциональный
  DegradedNoticeBanner (warm yellow alert с preview-only
  Retry/View actions, появляется только когда в snapshot
  есть `degradedNotice`). Live API binding intentionally не
  включён — это design implementation фича. `/candidates`
  использует `CandidatesScreen` — Web Operator Console
  candidate registry + face enrollment panel поверх
  `useConsoleCandidates` hook'а + scenario-driven fixtures
  (`consoleRegistryFixtures.ts`): compact header с totals
  (records + awaiting enrollment), filters bar (search +
  5 enrollment chips All / Not enrolled / In progress /
  Quality issues / Enrolled), dense sticky-header table
  (Candidate / Masked DOB / Eligibility / Face template)
  с keyboard-accessible primary-cell button (R2) и detail
  aside с avatar (инициалы), Identity dl (Masked DOB —
  `**.**.YYYY` privacy mask / Document / Eligibility /
  Last enrollment) и **Face enrollment** panel (face icon
  + status badge + Template status + Source device + note
  «Per-exam face verification and passive liveness checks
  are tracked outside this view» + disabled Start enrollment
  / Sessions actions). 9 enrollment states покрыты в
  fixtures: enrolled / capturing / command-sent /
  ready-to-enroll / not-enrolled / quality-failed /
  needs-retry / device-unavailable / session-expired.
  Separation сохранена: enrollment-only surface; per-exam
  face verification и passive liveness намеренно вне
  scope. `Register candidate` ведёт на `/candidates/new`
  → `CandidateCreateScreen` с формой (full name / DOB
  как `DD.MM.YYYY` со скрытием в реестре / document
  reference / exam category / eligibility) и client-side
  валидацией; save транзитит в `saved` state с
  моковым assigned id; `Save and start enrollment`
  открывает `StartEnrollmentDialog` модалку с phase state
  machine `selecting → command-queued / local-prepared`.
  В `selecting` фазе — channel selection (Android registrar
  / Local Web camera), per-channel device state card
  (registrar device id / station / last seen / battery &
  network; local camera model / detection / second-monitor
  copy) и actions Send to registrar / Use local camera
  (enabled когда channel доступен; клик переключает phase),
  Retry (disabled с visible reason note когда current
  attempt active), Cancel. В committed фазе — status panel
  c `role="status"`: «Command queued for the registrar
  tablet» / «Local capture prepared on this PC» + target
  device + explanatory copy («No real Android transport is
  wired in this baseline» / «No real camera capture runs in
  this baseline» + follow-up note про session monitor) +
  Close button. Каждый closed→open transition сбрасывает
  phase обратно в `selecting`. 5 enrollment scenarios
  покрыты в `consoleEnrollmentChannelsFixtures.ts`:
  registrar-online / registrar-offline /
  local-camera-available / local-camera-unavailable /
  attempt-active. `/candidates/sessions/[sessionId]` →
  `EnrollmentSessionMonitor`: Web Operator Console
  enrollment-session monitor surface поверх
  `useConsoleEnrollmentSession` hook'а + scenario-driven
  fixtures (`consoleEnrollmentSessionFixtures.ts`). Header
  с breadcrumb (Candidates registry › Enrollment session
  monitor), title, ENR-id chip (mono), state badge + TTL
  (mono, muted в terminal states). Body — 2-col grid: левая
  карточка Session facts (Candidate name + mono CND id /
  Channel / Target device mono + station / Last event mono)
  с actions row Retry (refresh icon, secondary) и Cancel
  session (X icon, danger); правая карточка Timeline ·
  audit с per-entry StatusDot rail + label + note + mono
  time. 8 scenarios покрыты в фикстурах (queued / accepted
  / capturing / ttl-warning / quality-failed / finalized
  / expired / cancelled) — каждая разворачивает session
  state в полную audit timeline до этого момента. Retry
  enabled на queued/accepted/ttl-warning/quality-failed,
  Cancel enabled на любом non-terminal state, оба disabled
  на terminal (finalized/expired/cancelled) с visible
  reason note. Клик Retry / Cancel транзитит state в
  `queued · retry` / `cancelled` соответственно, добавляет
  timeline entry, показывает committed status panel —
  никакого реального Android command transport / backend
  orchestration не вызывается. R1/R2 patterns: Skeleton
  + ApiErrorView early returns; навигация на monitor через
  `router.push("/candidates/sessions/ENR-9F41")` с Sessions
  кнопки в candidate detail pane. `/candidates/sessions/[id]/camera-station`
  → `CameraStationScreen`: Web camera station control panel
  поверх `useConsoleCameraStation` + scenario-driven
  fixtures (`consoleCameraStationFixtures.ts`). Header с
  breadcrumb (Candidates registry › Enrollment session
  monitor › Web camera station) + title «Camera station —
  operator PC» + subtitle. Body — 2-col grid: левая
  карточка Capture control (selected camera device row с
  camera icon + name + meta + permission state /
  capture-window status row с pulsing accent dot когда
  window open / Quality progress bars 4 items (Lighting /
  Sharpness / Face position / Stability) с tone-color
  fill / actions Open capture window (anchor с
  `target="_blank" rel="noopener noreferrer"` на
  `/capture/[id]`) + Retry + Cancel + Done) + visible
  reason note; правая dark карточка Second monitor с
  preview placeholder (face oval dashed) + mirror label +
  copy «The preview is shown to the candidate on the
  second monitor». 5 scenarios: ready / capturing
  (default) / done / cancelled / permission-denied.
  Retry/Cancel/Done transitions локальные через override
  state — никакого реального getUserMedia/WebRTC.
  `/capture/[sessionId]` → `CaptureWindowSurface`:
  standalone full-screen surface вне (shell) group для
  открытия в отдельном browser window. Window title bar
  (green dot + «Capture for enrollment» + mono ENR id +
  close button) + dark preview frame с teal-bordered face
  oval + «Look straight into the camera» / «Keep your face
  inside the oval · do not move» + candidate context
  overlay (name + mono masked DOB + mono CND id) + quality
  chips (Face in oval / Eyes open / Hold still — degraded
  tone когда applicable) + footer с lock icon + privacy
  copy «Frames are processed on the node. Images do not
  leave NODE-A2.» + progress bar (aria-valuenow) +
  best-frame mono line + Done / Cancel buttons.
  Phase state `capturing → done | cancelled` с overlay
  status panel и disabled actions в terminal states.
  Никакого реального `getUserMedia()` / MediaStream /
  WebRTC / image upload / biometry inference. Реальный
  Android command transport, WebSocket/SSE/live polling и
  biometry-service live binding остаются вне scope и
  должны быть отдельными фичами. `/vehicles`
  использует `VehiclesScreen` — тот же visual pattern
  поверх `useConsoleVehicles`: header с totals (vehicles +
  degraded + offline), filters (search / device state),
  table (Vehicle / Plate / Cat / Onboard device / Last
  seen) и detail pane с device badge, **Equipment health**
  block (per-row dot+badge: front/side cameras, GNSS,
  telemetry uplink), Device (Firmware / Last telemetry) и
  disabled actions (Diagnostics / Take offline).
  Register/Re-poll-devices buttons в header'ах disabled с
  объясняющим `title`. Live API binding не реализован — это
  design implementation; реальные endpoints + register
  forms вернутся в отдельных фичах после завершения
  спринта. `/exams` использует `ExamsScreen` — Autodrome
  Console exam operations surface поверх `useConsoleExams`
  hook'а + scenario-driven fixtures
  (`consoleExamsFixtures.ts`): header с totals (in-progress
  + scheduled today) + disabled Create-exam, 5 filter tabs
  (`All|In progress|Scheduled|Finished|Aborted`) через
  `role="tablist"`, dense sticky-header table (Exam ID
  mono + route/vehicle / Candidate / State badge / Score)
  с keyboard-accessible `<button>` в primary cell, detail
  aside с header (exam ID mono + state badge), 2×2 metadata
  grid (Candidate / Vehicle / Exercise route / Started ·
  duration), **Lifecycle** action row (Start/Finish/Abort
  — все disabled до lifecycle-integration фичи) и
  **Timeline** rail с per-event `StatusDot` + label +
  monospace timestamp + detail. Loading → Skeleton,
  fatalError → ApiErrorView с retry (R1 pattern из
  registry-фичи). Live API binding не реализован — это
  design implementation. `/exercises` использует
  `ExercisesScreen` — Autodrome Console configuration surface
  поверх `useConsoleExercises` hook'а и scenario-driven
  fixtures (`consoleExercisesFixtures.ts`): header с totals
  (groups · drafts) + disabled `New exercise` CTA, трёхколоночная
  раскладка groups nav (`<button>` per group с count, R2 keyboard
  accessibility через `aria-current`) / catalog table (Code mono /
  Exercise / Ver mono / Status badge, primary-cell `<button>` с
  `:focus-visible` outline) / detail aside с code/name/status,
  Parameters dl (Version / Difficulty / Max duration / Linked rule)
  и Publish + Edit draft action row (оба disabled до publish
  integration фичи). Loading → Skeleton, fatalError →
  ApiErrorView с retry (R1 pattern). `/violations` использует
  `ViolationsScreen` — `useConsoleViolations` поверх
  `consoleViolationsFixtures.ts`: header с активной rule version
  badge (mono `RULE-014 · v6`) и severity legend
  (Critical/Major/Minor), двухколоночная table (Code mono /
  Violation / Severity badge / Penalty right-aligned mono / Status
  badge, primary-cell `<button>`) / detail aside с code+name+
  severity+status, Scoring dl (Penalty + Active rule) и Required
  evidence chips (Telemetry/Video/Photo/Audio с per-kind dot
  swatch). Loading/error через R1. `/rules` использует
  `RulesScreen` — `useConsoleRules` поверх
  `consoleRulesFixtures.ts`: header (Scoring rule sets · draft &
  published versions) + disabled `New rule` CTA, table (Rule
  name+id / Ver mono / Status / Updated right-aligned mono) /
  detail aside с rule id+ver mono, name+status badge, секцией
  **Condition tree** с `EDITOR · PLANNED` tag и read-only mono
  `<pre>` preview условий (IF/AND/OR/THEN), явной note «Visual
  condition tree editor ships in a later milestone», секцией
  **Version history** (current + archived версии) и action row
  Publish version / Save draft (оба disabled). Визуальный
  condition tree editor намеренно не реализован сверх approved
  baseline. Rule evaluation на frontend намеренно не реализован
  — это задача backend `violation-rule-service`.
  `/evidence` использует `EvidenceScreen` — Autodrome Console
  evidence inspector surface поверх `useConsoleEvidence` hook'а и
  scenario-driven fixtures (`consoleEvidenceFixtures.ts`): header
  с subtitle «Sealed references · biometry, audio, telemetry,
  media» + disabled `Export selected` CTA, optional
  `DegradedState` banner для `service-degraded` сценария поверх
  таблицы, двухколоночная table (Reference — id+exam mono /
  Type chip / Captured mono / Size right-aligned mono / Status
  badge, primary-cell `<button>` с `:focus-visible` outline и
  `aria-current`) / detail aside `<aside aria-label="Evidence
  {id}">` с id+status row, type chip, секцией **Media preview**
  (тёмный 150px box с inline camera SVG и моно-caption
  «{type} · preview unavailable offline» — оффлайн-placeholder,
  никакого RTSP/WebRTC/HLS player'а), секцией **Reference** dl
  (Source exam / Captured / Size on node / SHA-256 short form
  `a1f4…9c20`) и action row Verify hash + Export (оба disabled
  с title-объяснениями). Canonical media-archive-service
  OpenAPI пока не содержит `GET /evidence` list operation —
  данные fixture-driven; loader переключится на typed
  adapter call когда endpoint появится. Actual video
  streaming/playback и большие media-выгрузки не реализованы. `/operations` использует
  `ServiceHealthDashboard`: дашборд liveness/readiness для
  backend/edge/deploy сервисов локального узла через
  fixture-based loader (`defaultServiceHealthLoader`). Тип
  `ServiceHealth` локальный (canonical aggregator endpoint в
  backend OpenAPI пока отсутствует; loader переключится на
  typed adapter call, когда endpoint появится). Дашборд
  показывает фильтры (search, kind `backend|edge|deploy`,
  liveness `healthy|degraded|down|unknown`), таблицу с
  liveness/readiness/lastCheck бейджами и detail panel с
  Latest-incident секцией (errorMessage + correlationId
  показываются для не-healthy сервисов через canonical
  `Correlation-Id` форму). Reload action триггерит повторный
  загрузчик. Polling/WebSocket/SSE/Prometheus/Grafana
  intentionally не реализованы.

  Поверх `ServiceHealthDashboard` `/operations` использует
  `OperationsTabs` с четырьмя вкладками: Service health,
  Diagnostics, Backups, Logs. `DiagnosticsPanel` показывает
  идентификацию локального узла (nodeId/build/runtime/
  storage) и preview-кнопку «Record a diagnostics request»;
  кнопка «Run diagnostics check» disabled до подключения
  backend. `BackupsPanel` показывает snapshots
  (fixtures-based, нет canonical backup DTO), Create backup
  (preview) и Restore (preview) для completed-snapshots
  через единый `ConfirmDestructiveDialog` (Modal с warning
  баннером, Cancel-by-default фокус, danger Confirm). После
  Confirm в activity log записывается «pending wiring» запись
  — никакого реального backup/restore выполнения не
  происходит, никаких API calls. `LogsPanel` — placeholder
  для будущего log viewer + preview Export-запрос с тем же
  паттерном. Actual backup/restore engine и log export
  endpoint intentionally не реализованы. Все 8 route'ов
  теперь —
  domain workspaces, RoutePlaceholder больше не используется.

## Autodrome Console design foundation

Visual reference: [`design/web-operator-console/Web Operator Console.dc.html`](../../design/web-operator-console/Web%20Operator%20Console.dc.html)
(статический HTML-макет в корне проекта Autodrome; ранее
`design/Autodrome Console.dc.html`). Из него перенесена
визуальная база: warm gray work surface (`--color-bg: #e6e5e1`),
dark topbar (`#1b1c1f`), light off-white sidebar (`#f3f2ef`),
teal accent (`#138a7c`) и operational status palette (online /
degraded / offline / standby / unknown). Density сделана плотнее
skeleton-варианта: row 28/32px, font 12–14px по умолчанию, card
padding 11/14px. Shell-wide affordances (sidebar route SVG
icons, topbar brand mark + cluster identity + operator block,
plus icon на primary create/register CTAs, circular refresh
icon на reload actions, inline search magnifier в search inputs,
node-component service rows в dashboard fixtures) выровнены с
reference в фиче `frontend-autodrome-shell-reference-alignment`;
визуальный язык (teal accent / English copy / wide grouped
sidebar) остался прежним и не заменялся blue accent / Russian
copy / 54px narrow icon-nav из reference.

Шрифты — IBM Plex Sans / IBM Plex Mono **если установлены
локально на машине пользователя**, иначе fallback на системный
font stack (`-apple-system`, BlinkMacSystemFont, …) и
`ui-monospace`. Никакого `next/font/google` и CDN — build/dev
работают полностью offline (это исторический архитектурный
constraint).

Shell:

- `(shell)/_components/ConsoleTopbar.tsx` — dark topbar 46px:
  brand (teal mark + AUTODROME) + `LOCAL NODE` chip + cluster
  node identity (`StatusDot`, NODE id, ONLINE label) + cluster
  DB/Media/Tel dot indicators + operator avatar/name/role.
  Все clusters разделены `--color-border-dark` divider'ом.
- `(shell)/_components/SidebarNav.tsx` — sidebar 228px с
  группами `SHELL_NAV_GROUPS` (ungrouped Dashboard, REGISTRY,
  CONFIGURATION, SYSTEM). Активная ссылка подсвечивается
  teal-soft background и `aria-current="page"`. Совместимость
  с старым flat `SHELL_ROUTES` сохранена (deflated через
  `flatMap`).
- `(shell)/_components/ConsoleSidebarFooter.tsx` — нижний блок
  sidebar: `Node storage` caption + mono-value + 5px progress
  bar (`role="progressbar"`, `aria-valuemin/max/now`) + build/
  offline + version mono. Прогресс клампится в `[0, 1]`.
- `(shell)/layout.tsx` — CSS grid `46px 1fr / 228px 1fr`.
  Topbar занимает row 1 / colspan 2. Sidebar — row 2 col 1.
  Main — row 2 col 2 со скроллом. На narrow viewports
  layout складывается в одну колонку с topbar/sidebar/content
  как rows.

`src/components/` содержит общие примитивы:

- `Button` — варианты `primary | secondary | danger | ghost`,
  sizes `sm | md`, опциональный `iconOnly`.
- `Input`, `Select`, `Textarea` — поля с label/hint/invalid
  через общий `Field.module.css`.
- `Table` — accessible table-обёртка с overflow-wrapper.
- `Tabs` (client) — управляемые табы с `useState`, ARIA
  tablist/tab/tabpanel.
- `StatusBadge` — варианты `neutral | info | success |
  warning | danger`.
- `StatusDot` — accessible цветной dot (`role="img"` с
  label или `aria-hidden` для декоративных), варианты
  `online | degraded | offline | standby | unknown`,
  опциональный halo.
- `ConsoleCard` — основной surface для виджетов: header
  с title + optional aside, body с padding или edge-to-edge
  через `flush`. Используется в будущих dashboard widgets.
- `Toolbar` + `ToolbarSection` — горизонтальный
  action-контейнер.
- `Modal` (client) — обёртка над нативным `<dialog>`
  (`showModal()`/`close()`, Escape, backdrop-click).
- `State` / `EmptyState` / `LoadingState` / `ErrorState` —
  единые заготовки пустых, загрузочных и ошибочных
  состояний.
- `Skeleton` — анимированный placeholder с регулируемым
  числом строк, `role="status"` + `aria-busy`, уважает
  `prefers-reduced-motion`.
- `ApiErrorView` (client) — рендерит canonical REST
  `ErrorEnvelope` через `ApiError`: code, message, HTTP
  status, `Correlation-Id` c кнопкой copy и optional retry
  action.
- `DegradedState` — баннер «service degraded» (предполагается
  для `service-degraded` сценария mock-адаптера и реальных
  HTTP 503) с optional retry.
- `ValidationErrors` — список ошибок валидации
  `{field, message}`, используется как form-level baseline
  до подключения форм.

Все примитивы используют только CSS custom properties и
CSS modules без runtime token-системы и без JS-генерации
стилей. Operational status palette (
`--color-status-online`, `--color-status-degraded`, …) и
её halo-varianты выведены как явные токены, чтобы
dashboard widgets из дизайн-референса могли подключаться
без one-off inline color'ов.

## Связанные репозитории

- Backend monorepo: `../Autodrome`
- Документы и backlog: `Управление реализацией/` в корне проекта Autodrome.

## Технологии

- Next.js 16 (App Router, Turbopack).
- React 19.
- TypeScript 5.
- ESLint 9 (flat config, `eslint-config-next`).
- Vitest 4 с `happy-dom` для component-тестов.
- `@testing-library/react` 16 для render-тестов компонентов.
- pnpm 11 как package manager.

Шрифты — IBM Plex Sans / IBM Plex Mono с fallback на системный
font stack в `src/app/tokens.css`. `next/font/google` и любые
CDN-шрифты не используются, build/dev работают полностью offline
(если IBM Plex локально не установлен — шрифт молча fallback'ится
к системному, дизайн остаётся читаемым).

## Команды запуска

Перед первым запуском установить зависимости:

```bash
pnpm install
```

Доступные scripts:

- `pnpm dev` — Next.js dev server на http://localhost:3000.
- `pnpm build` — production build.
- `pnpm start` — запуск production build (после `pnpm build`).
- `pnpm lint` — ESLint по проекту.
- `pnpm typecheck` — `tsc --noEmit` по всему проекту (включая
  тесты и `*.mts`).
- `pnpm test` — Vitest (один прогон). Покрывает unit, component
  и release-smoke тесты.
- `pnpm release-gate` — composite gate для релиза:
  последовательно `contracts:check && lint && typecheck && test
  && build`. Exit 0 — релиз готов к hand-off в deploy track.
- `pnpm contracts:check` — проверка, что canonical contracts из
  backend monorepo доступны и содержат ожидаемые подпапки и
  OpenAPI specs для services из `contracts.config.json`.
- `pnpm contracts:generate` — генерирует TypeScript types из
  OpenAPI specs в `src/contracts/types/<service>.ts`. Перед запуском
  внутренне валидирует canonical contracts.
- `pnpm e2e:install` — one-shot: качает Chromium для Playwright
  (~170 MB → `~/Library/Caches/ms-playwright`). Нужно один раз
  на машине.
- `pnpm e2e:build` — `next build` с
  `NEXT_PUBLIC_API_ADAPTER=mock` и
  `NEXT_PUBLIC_MOCK_SCENARIO=normal` (env baked into build, так
  что `next start` будет работать через mock adapter).
- `pnpm e2e` — `e2e:build` + `playwright test`. Поднимает
  `next start` на порту 3100, прогоняет `e2e/smoke.spec.ts` в
  chromium-only project (single worker, retain trace on
  failure).

## Release gate

Релиз идёт через единственный composite-скрипт `pnpm release-gate`.
Он чейнит `pnpm contracts:check && pnpm lint && pnpm typecheck &&
pnpm test && pnpm build` — в указанном порядке, остановка на первой
ошибке. Каждый шаг — это «жёсткий» гейт, который проверяет один
аспект:

1. **contracts** — canonical OpenAPI/event/proto доступны, services
   из `contracts.config.json` присутствуют и сгенерированы.
2. **lint** — ESLint flat config без warnings.
3. **typecheck** — `tsc --noEmit` по всему проекту, включая тесты;
   это шире, чем встроенный TypeScript pipeline в `next build`.
4. **test** — Vitest one-shot: unit, component и release-smoke
   тесты. Release smoke (`src/__tests__/release-smoke.test.tsx`)
   монтирует default-export каждой shell-страницы (`/dashboard`,
   `/candidates`, `/vehicles`, `/exams`, `/exercises`, `/violations`,
   `/rules`, `/evidence`, `/operations`) с `NEXT_PUBLIC_API_ADAPTER
   =mock`/`NEXT_PUBLIC_MOCK_SCENARIO=normal` и убеждается, что
   level-1 heading появляется (страница смонтировалась без
   throw'ов).
5. **build** — Next.js production build (Turbopack). Все shell-
   роуты должны быть `○ (Static)`.

Browser smoke (`pnpm e2e`) — отдельный, opt-in гейт поверх
Playwright + Chromium. В composite `release-gate` он намеренно
**не** включён, потому что требует one-shot `pnpm e2e:install`
(~170 MB Chromium-бинарь). Запуск browser smoke документирован
как отдельный шаг в release checklist; оператор запускает его
после `release-gate`, если Playwright уже установлен на машине.
Spec файлы:

- `e2e/smoke.spec.ts`:
  - `/` redirect → `/dashboard` + рендер heading;
  - `/dashboard`, `/candidates`, `/vehicles`, `/exams`,
    `/operations` — каждый рендерит level-1 heading;
  - shell sidebar: `aria-current="page"` следует за активным
    маршрутом (dashboard → candidates переход).
- `e2e/mobile-shell.spec.ts` — проверка отсутствия
  horizontal overflow на 11 routes @ 375x812 (включая
  `/candidates/new`, `/candidates/sessions/ENR-9F41` и
  `/candidates/sessions/ENR-9F41/camera-station`).
- `e2e/web-operator-console-design-gate.spec.ts` — Web
  Operator Console design-rework quality gate. Покрывает
  6 reference screens × 2 viewports (1440×900 desktop +
  375×812 narrow): candidate registry / candidate create /
  start enrollment dialog (opened from /candidates/new
  через valid Save and start enrollment) / session
  monitor / camera station / standalone capture window
  (`/capture/[id]` вне `(shell)`). Per-screen assertions:
  level-1 heading visible / primary CTA visible (button
  или styled link) / no horizontal overflow / detail
  disabled state visible там где deterministic (Retry на
  session monitor в default capturing scenario).
  Намеренно вне scope: pixel-perfect visual diff tooling и
  real camera permission automation.

Vitest release-smoke (`src/__tests__/release-smoke.test.tsx`)
остаётся в composite `release-gate` как лёгкий jsdom-уровневый
mount-signal — он не заменяет browser smoke, но даёт быстрый
сигнал без зависимости от Chromium.

Пошаговый release checklist (с iCloud preview, prod-only install,
optional browser smoke и hand-off в deploy track) лежит в
[RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) в корне репозитория.

## Contracts source of truth

Frontend repo **не** хранит собственные DTO, OpenAPI/proto/event схемы
и не дублирует канонические контракты. Единым source of truth остаётся
`contracts/` в backend monorepo:

- абсолютный путь: `../Autodrome/contracts` относительно корня этого
  repo;
- canonical layout фиксируется в `Управление реализацией/architecture/`
  и в `contracts/README.md` backend monorepo.

В этом repo источник правды зафиксирован в `contracts.config.json`:

```json
{
  "path": "../Autodrome/contracts",
  "requiredSubdirectories": ["openapi", "events", "proto", "dto", "docs"]
}
```

### Workflow

- Перед запуском любых contract-зависимых работ проверять наличие
  канонических контрактов: `pnpm contracts:check`.
- Если backend monorepo не лежит рядом, проверка падает с понятной
  ошибкой и подсказкой выровнять layout под `contracts.config.json`.
- DTO, схемы событий, OpenAPI/proto **не** копировать в этот repo
  локально. Если нужен типизированный API client — он генерируется
  отдельной фичей (`feature/frontend-api-client-baseline` и далее),
  а не вручную дублируется.
- Менять канонические контракты в этом repo запрещено: правки идут
  только в backend monorepo через соответствующие backend-фичи.

### Typed API client baseline

`src/contracts/types/<service>.ts` — auto-generated TypeScript типы,
рождаются из соответствующих OpenAPI specs через
`pnpm contracts:generate` (бинд `openapi-typescript`). Файлы помечены
banner-ом `AUTO-GENERATED FILE — DO NOT EDIT`; редактировать их
вручную запрещено. Правки идут в backend monorepo, затем — re-generate.

`src/api/` — request/error baseline поверх сгенерированных типов:

- `correlation.ts` — `newCorrelationId()` через `crypto.randomUUID()`
  и константа header-имени `Correlation-Id` из
  `contracts/docs/common-dto-and-error-model.md`.
- `errors.ts` — типы `ErrorEnvelopeBody`, класс `ApiError` и
  `parseErrorResponse(response, url)` для канонического envelope.
- `client.ts` — `createAutodromeClient<Paths>(options)` поверх
  `openapi-fetch`. Middleware добавляет `Correlation-Id` к каждому
  запросу, default timeout через `AbortController`, парсит non-2xx
  в `ApiError`.
- `services/<name>.ts` — по одному файлу на сервис, инстанцирует
  типизированный client с `baseUrl: "/api/<name>/v1"`.
- `index.ts` — barrel для всего slice.

Generated client покрывает 6 сервисов: `candidate`, `vehicle`,
`exam`, `exercise`, `violation-rule`, `media-archive`. Auth
tokens и оставшиеся domain-страницы — следующие фичи.

### Runtime API mode (mock / live)

`src/api/adapter.ts` объявляет `AutodromeApi` интерфейс над 6
типизированными сервисами; `src/api/get-api-adapter.ts` собирает
адаптер на основе runtime-конфига, который выбирается через
`src/api/runtime-config.ts`.

- `mode: "mock"` (default) → `createMockAdapter(scenario)` — те
  же типизированные клиенты, но с подменённым `fetch`, который
  возвращает fixture-данные. Это development-safe режим: на
  свежей машине без env переменных `pnpm dev` стартует именно
  здесь и ни в один реальный сервис не ходит.
- `mode: "live"` → `createLiveAdapter(baseUrls)` —
  `openapi-fetch` клиенты против настроенных base URLs.

Переключатель управляется env-переменными (`NEXT_PUBLIC_*`,
читаются на build-time для статического экспорта):

- `NEXT_PUBLIC_API_ADAPTER` = `"mock" | "live"`. Любое значение,
  отличное от `"live"` (включая отсутствие), резолвится в
  `"mock"`. Так у разработчика по дефолту нет случайного выхода
  в неконфигурированный backend.
- `NEXT_PUBLIC_MOCK_SCENARIO` (только для mock) = одно из
  `MOCK_SCENARIOS` (default `"normal"`).
- `NEXT_PUBLIC_API_<SERVICE>_BASE_URL` (только для live) —
  per-service base URL, опциональный override относительно
  дефолтного `/api/<service>/v1`. Действующие ключи:
  - `NEXT_PUBLIC_API_CANDIDATE_BASE_URL`,
  - `NEXT_PUBLIC_API_VEHICLE_BASE_URL`,
  - `NEXT_PUBLIC_API_EXAM_BASE_URL`,
  - `NEXT_PUBLIC_API_EXERCISE_BASE_URL`,
  - `NEXT_PUBLIC_API_VIOLATION_RULE_BASE_URL`,
  - `NEXT_PUBLIC_API_MEDIA_ARCHIVE_BASE_URL`.
  Допустимы абсолютные URL (`https://...`) или path с лидирующим
  `/`. Невалидное значение не валит UI: сервис откатывается на
  свой дефолтный base URL, а в diagnostics отображается
  degraded-state.

Options передаваемые напрямую в `getApiAdapter({mode, scenario})`
имеют приоритет над env.

Diagnostics. `getRuntimeDiagnostics()` (экспортируется из
`@/api`) возвращает UI-безопасный snapshot текущего конфига —
только `mode`, `scenario` или `baseUrls` (+ список `issues` для
degraded-live). Никаких секретов. Этот snapshot выводится
в `/operations` → вкладка `Diagnostics`, секция
`Runtime API mode`: бейдж режима (info для mock, success для
ok-live, warning для degraded-live), сценарий или список base
URLs, и diagnostic-сообщение об ошибочных env, если они есть.

Под секцией `Runtime API mode` идёт `Service endpoints` —
таблица из 6 строк (по одной на typed frontend client).
Поля: `Service` (label + соответствующий env-ключ
`NEXT_PUBLIC_API_<SERVICE>_BASE_URL`), `Mode` (mock|live),
`Configured` (`configured`/`default` для live, `n/a` для mock),
`Base URL` (через `sanitizeBaseUrl()` — userinfo `user:pass@`
замаскирован как `***@`, query-параметры с `token`/`key`/
`secret`/`password`/`auth` в имени получают значение `***`),
`Last check` (результат последнего probe или `not checked`),
`Reachability` (кнопка `Check reachability`).

Reachability — opt-in, user-triggered и не делает destructive
вызовов. Кнопка disabled в mock-режиме. В live-режиме клик
делает idempotent `GET` к base URL с `credentials: "omit"`,
`cache: "no-store"` и `AbortSignal.timeout(3000)`.
Интерпретация ответа:

- `2xx` / `3xx` / `4xx` → `reachable` (success badge + HTTP
  статус). 4xx тоже считается reachable: сервер ответил, просто
  у root path нет совпадения.
- `5xx` → `degraded` (warning badge).
- сетевая ошибка → `error`; abort по таймауту → `unreachable`
  (danger badge).

Probe вызывается ровно один раз на клик, никаких background
polling/SSE/WebSocket. См. `src/api/probe-endpoint.ts` и
`src/api/sanitize-base-url.ts` для подробностей.

Сценарии (`src/api/mock/scenarios.ts`):

- `empty` — пустые списки во всех доменах;
- `normal` — спокойное состояние локального узла;
- `exam-in-progress` — активный экзамен;
- `violations-detected` — экзамен с зафиксированными violations;
- `service-degraded` — `vehicle-service` отвечает 503 с canonical
  error envelope, остальные сервисы — нормальные fixtures.

Fixtures (`src/api/mock/fixtures/`) типизированы поверх
`components["schemas"]["..."]` из сгенерированных контрактов — то
есть невалидные данные ловит TypeScript компилятор. Mock не
содержит бизнес-логики: handlers только отдают канонические
fixtures по URL/method и возвращают `404` с
`MOCK_HANDLER_NOT_FOUND` для неучтённых маршрутов.

Mock покрывает list endpoints (`GET /candidates`,
`GET /vehicles`, `GET /exercises`, `GET /violations`,
`GET /rules`) и доменные мутации, требуемые активными
workspace'ами: `POST /candidates`, `POST /vehicles`,
`POST /exams`, `POST /exams/{id}/{start,finish,abort}`,
`POST /exercises`, `POST /exercises/{id}/publish`,
`GET /exercises/{id}/versions/{vid}`, `POST /exercise-groups`,
`POST /violations`, `POST /rules`,
`POST /rules/{ruleId}/publish`. Все mock POST/publish handlers
возвращают full contract-shape по канонической OpenAPI
(включая required identity fields) — это нужно, чтобы
workspace mirror cache не терял идентичность после insert
или patch. Остальные методы интегрируются по мере появления
новых доменных страниц.

### Web enrollment view-model + adapter boundary

Web enrollment surfaces (`/candidates` registry, candidate
create at `/candidates/new`, enrollment session monitor at
`/candidates/sessions/[id]`, camera station at
`/candidates/sessions/[id]/camera-station`, capture window at
`/capture/[sessionId]`) consume **typed view-models**, не raw
OpenAPI DTOs. Boundary живёт в
`src/app/(shell)/candidates/_adapter/`:

- `webEnrollmentViewModels.ts` — barrel re-export всех 8
  view-model типов из spec'а (candidate registry row /
  candidate detail / enrollment state с 9-value union /
  enrollment channel / registrar device / local camera station /
  enrollment session / session timeline event). UI-компоненты
  импортируют типы только отсюда (или транзитивно из
  per-surface snapshot файлов, которые barrel re-export'ит).
  Импорт raw OpenAPI DTO из `@/contracts/types/*` в render-слой
  запрещён.
- `webEnrollmentAdapter.ts` — `WebEnrollmentAdapter` interface
  объявляет 4 read-метода (`loadCandidates` /
  `loadEnrollmentChannels` / `loadEnrollmentSession(id)` /
  `loadCameraStation`) и 2 command-метода
  (`retryEnrollmentSession(id)` /
  `cancelEnrollmentSession(id)`). Read-методы возвращают
  view-models. Command-методы возвращают результирующий
  snapshot c делтой (transition + audit append), чтобы экран
  рендерил новый state без отдельного refetch'а.
- `createMockWebEnrollmentAdapter({ scenarios })` + default
  `mockWebEnrollmentAdapter` — production-by-default
  mock implementation, обёртка над per-surface scenario
  fixtures. Все hooks (`useConsoleCandidates`,
  `useConsoleEnrollmentChannels`, `useConsoleEnrollmentSession`,
  `useConsoleCameraStation`) пока продолжают использовать
  `loader` DI prop (простая форма того же boundary'а — один
  метод на hook) — это сохраняет existing test setup; следующий
  refactor сможет привязать hooks к одному адаптерному инстансу
  без переписывания view-models или тестов.
- `README.md` в `_adapter/` — детальная mapping таблица + список
  отсутствующих canonical backend контрактов (`GET /candidates`,
  `GET /enrollment-channels`, `GET /enrollment-sessions/{id}`,
  `POST /enrollment-sessions/{id}/commands/{retry|cancel}`,
  `GET /camera-stations/{id}`, live event stream). Когда
  backend orchestration ships эти endpoints, live-adapter
  реализует `WebEnrollmentAdapter` поверх типизированного
  клиента — render-слой не меняется.

Web enrollment адаптер отделён от broader `AutodromeApi`
namespace (раздел выше) — он покрывает только enrollment
surfaces; `candidate-service` / `vehicle-service` / `exam-service`
domain mutations всё ещё проходят через `AutodromeApi` когда
будут реализованы.

### Frontend live API error taxonomy

`src/api/error-taxonomy.ts` объявляет 8 stable категорий ошибок
live-API runtime (+ `unknown` fallback) и `classifyError(error)`
который маппит `ApiError` / `Error` / non-Error throws в категорию:

- `network` — backend unavailable / fetch failed / DNS / TCP /
  HTTP 502 / 5xx без узнаваемого envelope → `<DegradedState />`.
- `timeout` — request exceeded timeout, `HTTP 408` / `504` / native
  AbortError / "timed out" message → `<DegradedState />`.
- `unauthorized` — 401 / 403 / `UNAUTHORIZED` envelope. Маппится в
  auth-block UI с текстом «Authentication is not configured for
  this build» — реальной auth implementation нет (per spec
  constraint).
- `validation` — 400 / 422 / `VALIDATION_FAILED` envelope с
  `details.fields` или `details.issues`. Extract'ит per-field
  errors в `classification.fieldErrors`. Form-level handling
  (caller-side); глобальный ApiErrorView не показывается.
- `conflict` — 409 / `RESOURCE_CONFLICT` → `<ApiErrorView />` с
  hint про reload.
- `not-found` — 404 / `NOT_FOUND` → `<ApiErrorView />`.
- `contract-drift` — `DECODE_FAILURE` / `CONTRACT_DRIFT` /
  `INVALID_RESPONSE_BODY` / unknown envelope → `<DegradedState />`
  с dev-hint.
- `degraded` — 503 / `SERVICE_DEGRADED` / `PARTIAL_DATA` envelope
  → `<DegradedState />`. Данные могут быть stale / partial.

Каждая категория несёт UI kind (`degraded-banner` / `error-view`
/ `form-field` / `auth-block`), stable title + description,
`retryable` boolean и опциональные `fieldErrors`. `ApiErrorView`
автоматически показывает category chip в header + category-hint
параграф под raw message — UI-инвариант для всех existing call
sites сохранён (raw `error.code` остаётся primary title, raw
`error.message` — primary message). Future live-binding фичи
просто бросают `ApiError` (через существующий
`parseErrorResponse(response, url)` в `src/api/errors.ts`) — UI
сам решит какой primitive показать через `classifyError()`.

### Candidate + Vehicle live API integration

`/candidates` и `/vehicles` workspaces подключены к live
`candidate-service` / `vehicle-service` API через типизированные
openapi-fetch клиенты в `src/api/services/`. Switching mode без
изменений в screen коде:

- `src/app/(shell)/candidates/_components/liveCandidatesLoader.ts`
  + `liveVehiclesLoader.ts` — pure DTO→view-model mappers +
  `liveCandidatesLoader(adapter)` / `liveVehiclesLoader(adapter)`
  loaders, которые вызывают `adapter.candidate.GET("/candidates")`
  / `adapter.vehicle.GET("/vehicles")` и мапят Candidate /
  Vehicle DTO из canonical OpenAPI types в `ConsoleCandidate` /
  `ConsoleVehicle` view-models.
- `useConsoleCandidates` / `useConsoleVehicles` defaultLoader
  переключается по `resolveRuntimeMode()`:
  - `mock` (default) → scenario fixtures (`consoleCandidatesFor`
    / `consoleVehiclesFor`) — `pnpm dev`/unit/e2e gates без
    backend.
  - `live` → live loader через `getApiAdapter({ mode: "live" })`.
- ApiError бросается `createAutodromeClient` middleware на
  non-2xx; UI surfaces ошибку через `<ApiErrorView>` который
  использует `classifyError()` для category-aware copy.

Mapping caveats (design-only blocks без canonical контрактов):

- `ConsoleCandidate.enrollment` — defaults to `not-enrolled` /
  `templateStatus: "—"` / `sourceDevice: "—"`; реальные template
  данные подключатся когда biometry-service ship'нет
  `GET /candidates/{id}/template`.
- `ConsoleCandidate.category` — `"—"` (exam category outside
  canonical Candidate DTO; backend planned, см. spec).
- `ConsoleCandidate.maskedDob` — mask из `birthDate` (ISO →
  `**.**.YYYY` privacy convention для регистра).
- `ConsoleCandidate.eligibility` — derived из `CandidateStatus`
  (registered/active → approved, suspended → pending decision,
  archived → expired, deleted → denied).
- `ConsoleVehicle.device` — derived из `VehicleStatus` +
  `boundEdgeGateway`/`boundDevice` presence: оба bound → online,
  частичный binding → degraded, decommissioned → offline,
  maintenance → degraded.
- `ConsoleVehicle.firmware` + `equipment[]` — design-only,
  defaults `"—"` / `[]` пока vehicle-edge-gateway-service не
  выставит telemetry endpoint.

Browser smoke `e2e/candidate-vehicle-workflow.spec.ts` проверяет
что live-loader code-path не ломает mock-mode workflows (registry
rows render, row-selection → detail aside follows, enrollment
chips filter narrows visible set, navigation Candidates →
Vehicles → Candidates через sidebar). Live transport tested на
unit layer (`live-candidates-loader.test.ts` /
`live-vehicles-loader.test.ts`) с mocked openapi-fetch clients.

### Exam live API integration

`/exams` workspace подключён к live `exam-service` lifecycle API:
detail / create / start / finish / abort + paginated timeline read.
Switching mode без изменений в screen коде:

- `src/app/(shell)/exams/_components/liveExamLoader.ts` — pure
  mappers (`mapExamDtoToConsole`, `mapTimelineEventToConsole`,
  `formatExamScore`, `formatExamDuration`) + commands:
  - `liveExamGet(adapter, examId)` — `GET /exams/{examId}`.
  - `liveExamCreate(adapter, creation)` — `POST /exams` с
    `Idempotency-Key` per call.
  - `liveExamStart(adapter, examId, start?)` —
    `POST /exams/{examId}/start`.
  - `liveExamFinish(adapter, examId, finish)` —
    `POST /exams/{examId}/finish` (outcome + optional score).
  - `liveExamAbort(adapter, examId, abort)` —
    `POST /exams/{examId}/abort` (reason).
  - `liveExamTimeline(adapter, examId, query?)` —
    `GET /exams/{examId}/timeline` с pageSize/pageToken/sortOrder
    query params.
- `useConsoleExams` defaultLoader переключается по
  `resolveRuntimeMode()`:
  - `mock` (default) → scenario fixtures (`consoleExamsFor`) —
    `pnpm dev`/unit/e2e gates без backend.
  - `live` → `liveExamsLoader(getApiAdapter({mode:"live"}))`.

Backend gaps (документированы):

- `GET /exams` (list) — **отсутствует в canonical exam-service
  contract**. В live mode `liveExamsLoader` возвращает empty
  snapshot, `<EmptyState>` рендерится корректно. Detail / lifecycle
  / timeline остаются live. Tech-debt entry в feature report.
- `ConsoleExam.route` — design-only label, defaults `"—"` пока
  exam-service не выставит route metadata field.
- `ConsoleExam.timeline detail` — actor-id fallback `"actor X"` или
  `"—"`; полный human-readable narrative ждёт payload-schema
  publication для каждого event-type.

Browser smoke `e2e/exam-workflow.spec.ts` проверяет, что
live-loader code-path не регрессит mock-mode workflow (heading +
rows render, state filter tabs flip, row selection switches detail
aside, sidebar navigation round-trip). Live transport tested на
unit layer (`live-exam-loader.test.ts`) с mocked openapi-fetch
client.

### Exercise live API integration

`/exercises` workspace подключён к live `exercise-service`:
combined catalog+groups read, exercise detail / create / publish,
version read, exercise group create. Backend gap для update
operation surfaces'ится через явный `ExerciseUpdateUnsupportedError`
(не silent success).

- `src/app/(shell)/exercises/_components/liveExerciseLoader.ts` —
  pure mappers (`mapExerciseDtoToConsole`,
  `mapExerciseGroupDtoToConsole`, `mapExerciseStatus`) + commands:
  - `liveExercisesLoader(adapter)` — combined `GET /exercises` +
    `GET /exercise-groups` (parallel), снапшот собирается из обоих
    с lookup index `exerciseId → groupId`.
  - `liveExerciseGroupsLoader(adapter)` — groups-only read.
  - `liveExerciseGet(adapter, id)` — `GET /exercises/{id}`.
  - `liveExerciseCreate(adapter, creation)` — `POST /exercises` с
    `Idempotency-Key` per call.
  - `liveExercisePublish(adapter, id, draft)` —
    `POST /exercises/{id}/publish`.
  - `liveExerciseGetVersion(adapter, id, versionId)` —
    `GET /exercises/{id}/versions/{versionId}` (raw DTO).
  - `liveExerciseGroupCreate(adapter, creation)` —
    `POST /exercise-groups`.
  - `liveExerciseUpdate(adapter, id, update)` — **throws
    `ExerciseUpdateUnsupportedError`** (canonical
    exercise-service не выставил update endpoint; UI surfaces
    degraded state через ApiErrorView, не fake success).
- `useConsoleExercises` defaultLoader переключается по
  `resolveRuntimeMode()`:
  - `mock` (default) → `consoleExercisesFor(scenario)` fixtures.
  - `live` → `liveExercisesLoader(getApiAdapter({mode:"live"}))`.

Mapping caveats (design-only blocks):

- `ConsoleExercise.difficulty` / `maxDuration` / `linkedRuleId` —
  defaults to `"—"`; canonical `Exercise` DTO ещё не содержит этих
  полей. Когда backend extension доедет, mapper заполнит без
  изменения view-model shape.
- `ConsoleExercise.groupId` — derived из `ExerciseGroup.exerciseOrder`
  через lookup index в `liveExercisesLoader`; orphan exercises
  получают `"—"`.
- `ConsoleExercise.version` — `v{versionNumber}` из
  `currentVersion`, иначе `"—"`.
- Canonical `ExerciseStatus` (`draft` / `published` / `archived`)
  → console `ConsoleExerciseStatus` (`draft` / `published` /
  `retired`); `archived` mapping в `retired` через
  `mapExerciseStatus` (total).

Backend gap (документирован):

- `PUT/PATCH /exercises/{id}` — отсутствует в canonical contract.
  `liveExerciseUpdate` всегда бросает
  `ExerciseUpdateUnsupportedError` (code
  `EXERCISE_UPDATE_UNSUPPORTED`). Когда backend ship'нет update,
  функция превратится в реальный POST/PATCH wiring.

Browser smoke `e2e/exercise-workflow.spec.ts` (4 chromium tests)
проверяет, что live-loader code-path не регрессит mock-mode
workflow (heading + groups + catalog render, group filter
narrows visible set, row selection switches detail aside,
sidebar navigation round-trip с `aria-current="page"`). Live
transport tested на unit layer
(`live-exercise-loader.test.ts`) с mocked openapi-fetch client.

## Branch policy

Frontend bootstrap rule:

- Bootstrap commits (`Initial commit`, `Project created`) идут только в
  `master`.
- После skeleton commit `Project created` создаётся и используется ветка
  `develop`.
- Последующие feature-ветки создаются от `develop`, не от `master` и не
  от предыдущей feature-ветки.
- После approval фичи Victor Baykov мержит её в `develop`.
- `master` не трогать без отдельного прямого приказа Victor Baykov.
