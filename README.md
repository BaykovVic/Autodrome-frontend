# Autodrome Frontend

Frontend repository для проекта Autodrome — локального offline-first продукта
автодрома.

## Статус

Next.js / TypeScript app skeleton с минимальным operator console placeholder.
Доменные страницы, backend API, contracts/generated clients, auth, design
system и deploy artifacts не подключены — будут добавлены последующими
фичами согласно документам в `Управление реализацией/` корневого
репозитория проекта.

## Связанные репозитории

- Backend monorepo: `../Autodrome`
- Документы и backlog: `Управление реализацией/` в корне проекта Autodrome.

## Технологии

- Next.js 16 (App Router, Turbopack).
- React 19.
- TypeScript 5.
- ESLint 9 (flat config, `eslint-config-next`).
- Vitest 4 для тестов.
- pnpm 11 как package manager.

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
