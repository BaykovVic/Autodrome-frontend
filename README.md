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
  `LocalNodeDashboard` (client component) с местным `useDashboardData`
  hook'ом, который параллельно тянет данные 5 сервисов через
  `getApiAdapter()` и единообразно показывает loading/error/degraded
  состояния. `/candidates` использует `CandidateWorkspace` — list
  с фильтрами, detail panel и register form по
  `CandidateRegistration` контракту, тоже через
  `getApiAdapter()`. Остальные 7 routes — `RoutePlaceholder` до
  подключения domain workspaces.

## Design system

`src/components/` содержит примитивы, построенные поверх токенов из
`src/app/tokens.css`:

- `Button` — varianты `primary | secondary | danger | ghost`, sizes
  `sm | md`, опциональный `iconOnly`.
- `Input`, `Select`, `Textarea` — поля с label/hint/invalid через
  общий `Field.module.css`.
- `Table` — accessible table-обёртка с overflow-wrapper.
- `Tabs` (client) — управляемые табы с `useState`, ARIA tablist/tab/
  tabpanel.
- `StatusBadge` — варианты `neutral | info | success | warning | danger`.
- `Toolbar` + `ToolbarSection` — горизонтальный action-контейнер.
- `Modal` (client) — обёртка над нативным `<dialog>`
  (`showModal()`/`close()`, Escape, backdrop-click).
- `State` / `EmptyState` / `LoadingState` / `ErrorState` — единые
  заготовки пустых, загрузочных и ошибочных состояний.
- `Skeleton` — анимированный placeholder с регулируемым числом
  строк, `role="status"` + `aria-busy`, уважает
  `prefers-reduced-motion`.
- `ApiErrorView` (client) — рендерит canonical REST `ErrorEnvelope`
  через `ApiError`: code, message, HTTP status, `Correlation-Id`
  c кнопкой copy и optional retry action.
- `DegradedState` — баннер «service degraded» (предполагается для
  `service-degraded` сценария mock-адаптера и реальных HTTP 503)
  с optional retry.
- `ValidationErrors` — список ошибок валидации `{field, message}`,
  используется как form-level baseline до подключения форм.

Все примитивы используют только CSS custom properties и CSS modules
без runtime token-системы и без JS-генерации стилей.

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

Шрифты — системный font stack в `src/app/globals.css`. `next/font/google`
и любые CDN-шрифты не используются, build/dev работают полностью offline.

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
- `pnpm test` — Vitest (один прогон).
- `pnpm contracts:check` — проверка, что canonical contracts из
  backend monorepo доступны и содержат ожидаемые подпапки и
  OpenAPI specs для services из `contracts.config.json`.
- `pnpm contracts:generate` — генерирует TypeScript types из
  OpenAPI specs в `src/contracts/types/<service>.ts`. Перед запуском
  внутренне валидирует canonical contracts.

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

Generated client покрывает 5 сервисов: `candidate`, `vehicle`,
`exam`, `exercise`, `violation-rule`. Auth tokens и domain-страницы
— следующие фичи.

### Mock adapter и сценарные fixtures

`src/api/adapter.ts` объявляет `AutodromeApi` интерфейс над 5
типизированными сервисами и `getApiAdapter(options?)` фабрику:

- `mode: "live"` (default) → `createLiveAdapter()` — текущие
  `openapi-fetch` клиенты против реального backend baseUrl.
- `mode: "mock"` → `createMockAdapter(scenario)` — те же
  типизированные клиенты, но с подменённым `fetch`, который
  возвращает fixture-данные.

Переключатель управляется env-переменными:

- `NEXT_PUBLIC_API_ADAPTER` = `"mock" | "live"` (default `"live"`).
- `NEXT_PUBLIC_MOCK_SCENARIO` = одно из `MOCK_SCENARIOS` (default
  `"normal"`).

Options передаваемые напрямую в `getApiAdapter({mode, scenario})`
имеют приоритет над env.

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

Mock покрывает только list endpoints, нужные для skeleton UI:
`GET /candidates`, `GET /vehicles`, `GET /exercises`,
`GET /violations`, `GET /rules`. Остальные методы интегрируются по
мере появления реальных доменных страниц.

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
