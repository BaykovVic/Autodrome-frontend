# Frontend release checklist

This checklist runs in the frontend repository
(`Projects/Autodrome-frontend`). It produces a production build that
the deploy track picks up. The list is intentionally short: heavy
checks live in the composite release gate so a single command catches
regressions.

Prerequisite: the target branch (usually `develop`) is up to date and
all feature reviews on it are `APPROVED`. `master` is moved only on
explicit instruction.

## 1. Sync the working tree

```bash
cd /Users/baykov/Documents/Autodrome/Projects/Autodrome-frontend
git fetch
git switch develop
git pull --ff-only
```

Verify:

- [ ] `git status --short --branch` shows clean tree on `develop`.
- [ ] `git log --oneline --decorate -1` matches the expected
  approved feature merge.

## 2. Install dependencies

```bash
pnpm install --frozen-lockfile
```

Verify:

- [ ] `pnpm install` finishes without warnings about peer
  dependencies or unmet platform requirements.

## 3. Run the composite release gate

```bash
pnpm release-gate
```

This is the single source of truth. It chains, in order:

1. `pnpm contracts:check` — canonical contracts are present and
   the configured services exist.
2. `pnpm lint` — ESLint (Next.js flat config).
3. `pnpm typecheck` — `tsc --noEmit` over the whole project,
   including tests.
4. `pnpm test` — Vitest one-shot run (component, smoke and unit
   tests).
5. `pnpm build` — Next.js production build (also runs the Next
   TypeScript pipeline).

Verify:

- [ ] `pnpm release-gate` exits with status 0.
- [ ] Output shows the expected Next.js static route list (every
  shell route is `○ (Static)`).
- [ ] `Test Files` / `Tests` counts match the local feature
  reports.

If a gate fails, stop here, fix the underlying issue on a fresh
feature branch, and restart this checklist from step 1.

## 4. Capture the build artifact

The Next.js build leaves output under `.next/`. For the deploy
track the artifact is the entire `.next/` directory together with
`package.json`, `pnpm-lock.yaml`, `public/` (if present) and the
`node_modules/` snapshot produced by `pnpm install --prod`.

```bash
# Reproduce a production-only install in a separate directory to
# avoid mixing dev dependencies into the artifact.
pnpm install --prod --frozen-lockfile
```

Verify:

- [ ] `.next/standalone` (if Next produced it) or `.next/server`
  exists and is non-empty.
- [ ] `node_modules/` matches `pnpm-lock.yaml` content hashes after
  the prod install.

## 5. iCloud / macOS file duplication sweep

This repo lives under iCloud Drive. Duplicates like `* 2.tsx`
silently break the SDK-style backend project and confuse the
operator. Clean them before tagging.

```bash
find /Users/baykov/Documents/Autodrome/Projects/Autodrome-frontend \
  -name "* 2.*" -type f -delete
find /Users/baykov/Documents/Autodrome/Projects/Autodrome-frontend \
  -name "* 3.*" -type f -delete
```

Verify:

- [ ] Both `find` commands return without printing any path.

## 6. Hand-off to the deploy track

- [ ] Frontend release tag is created (only on explicit
  instruction; format `frontend-vX.Y.Z`).
- [ ] Artifact directory and the commit hash of the build are
  recorded in
  `Управление реализацией/release/frontend-<version>.md`
  (or the deploy track's equivalent), together with the output of
  the composite release gate.
- [ ] Backend repo (`Projects/Autodrome`) and Android repo
  (`Autodrome-mobile-app`) are explicitly noted as untouched by
  this frontend release.

## Out of scope

This checklist does not:

- build an installer (the deploy track packages and signs the
  artifact);
- run backend or Android gates (those have their own checklists);
- mutate `master` (frontend branch policy keeps `master` for
  bootstrap commits only).
