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
  использует `CandidatesScreen` — registry visual surface
  поверх `useConsoleCandidates` hook'а + scenario-driven
  fixtures (`consoleRegistryFixtures.ts`): compact header
  с totals (records + awaiting face verification), filters
  bar (search / category / registration status), dense
  sticky-header table (Candidate / Cat / Registration /
  Face verify / Exams) с tinted active row и detail pane
  с avatar (инициалы), reg badge, **Face verification**
  block (frame + dot + badge + confidence), Details list
  (Cat / DoB / Phone / Last activity) и disabled actions
  (Start exam / Capture face / Edit — service-specific
  workflows вне scope design implementation). `/vehicles`
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
  `/evidence` использует `EvidenceWorkspace`: media recordings,
  привязанные к экзаменам, через fixture-based loader
  (`defaultRecordingsLoader`) поверх `MediaRecording` контракта
  media-archive (`GET /media/recordings` в OpenAPI пока
  отсутствует; loader переключится на typed
  `api.mediaArchive.GET(...)` когда endpoint появится).
  Workspace показывает фильтры (search по recording/exam/source,
  status `active|finalized|failed`, modality `video|audio`),
  таблицу с modality-бейджами и detail panel с recording info,
  списком sources с domain-friendly labels (Cabin/Exterior
  cameras + Cabin microphone), media-segments placeholder
  без playback и секцией linked-evidence (video/audio из
  recording плюс biometry/telemetry бейджи как пометки про
  связь экзамена с другими evidence workspaces). Actual video
  streaming/playback, RTSP/WebRTC/HLS player и большие
  media-загрузки не реализованы. `/operations` использует
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

Visual reference: [`design/Autodrome Console.dc.html`](../../design/Autodrome%20Console.dc.html)
(статический HTML-макет в корне проекта Autodrome). Из него
перенесена визуальная база: warm gray work surface
(`--color-bg: #e6e5e1`), dark topbar (`#1b1c1f`), light off-white
sidebar (`#f3f2ef`), teal accent (`#138a7c`) и operational status
palette (online / degraded / offline / standby / unknown).
Density сделана плотнее skeleton-варианта: row 28/32px, font
12–14px по умолчанию, card padding 11/14px.

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
Spec файл — `e2e/smoke.spec.ts`:

- `/` redirect → `/dashboard` + рендер heading;
- `/dashboard`, `/candidates`, `/vehicles`, `/exams`,
  `/operations` — каждый рендерит level-1 heading;
- shell sidebar: `aria-current="page"` следует за активным
  маршрутом (dashboard → candidates переход).

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
