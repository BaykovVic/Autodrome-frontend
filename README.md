# Autodrome Frontend

Frontend repository для проекта Autodrome — локального offline-first продукта
автодрома.

## Статус

Next.js / TypeScript app shell для operator/admin консоли с design
system baseline и pointer на canonical contracts. Backend API,
generated API client, формы и таблицы с реальными данными, auth,
deploy artifacts не подключены — будут добавлены последующими
фичами согласно документам в `Управление реализацией/` корневого
репозитория проекта.

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
  `DashboardConsole` (client component) с Toolbar, Tabs, Table,
  Button, Modal и StatusBadge как живой демонстратор design system.

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
  backend monorepo доступны и содержат ожидаемые подпапки.

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

В этой фиче (`feature/frontend-contract-source-of-truth`) подключение
ограничено указанием пути и lightweight presence-check. Generated
client, типизированные fetcher-ы и schema-driven validation —
последующие фичи.

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
