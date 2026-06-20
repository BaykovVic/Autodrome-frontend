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

## 3a. Browser smoke (optional, opt-in)

The composite release gate runs a jsdom-level smoke
(`src/__tests__/release-smoke.test.tsx`) but does **not** launch
a real browser, because Playwright requires a one-shot Chromium
download. If you want to verify the production-like Next.js app
in real Chromium before tagging, run the browser smoke
separately:

```bash
# One-shot per machine (downloads Chromium to ~/Library/Caches).
pnpm e2e:install

# Build with mock adapter env baked in, then run the spec.
pnpm e2e
```

Verify:

- [ ] `pnpm e2e` exits 0.
- [ ] Report shows 7 passed tests (root redirect, 5 key routes,
  sidebar `aria-current`).

This step is optional. Skip it if Chromium cannot be installed
on the release machine — the jsdom-level smoke inside step 3
still covers the page mount signal.

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

## 5. iCloud / macOS file duplication preview

This repo lives under iCloud Drive. Duplicates like `* 2.tsx`
silently break the SDK-style backend project and confuse the
operator. The release gate must not silently delete files —
this step previews any duplicates so the operator can review
them before deciding what to do.

### 5a. Preview only (non-destructive)

```bash
find /Users/baykov/Documents/Autodrome/Projects/Autodrome-frontend \
  \( -name "* 2.*" -o -name "* 3.*" \) -type f -print
```

Verify:

- [ ] The preview command finishes and prints **no paths**.

### 5b. If duplicates appeared

Do **not** run a blanket `-delete`. Instead:

1. Read every printed path and confirm it is genuinely an
   iCloud sync duplicate (e.g. `Foo 2.tsx` next to `Foo.tsx`
   with identical content), not in-progress work.
2. Remove the confirmed duplicates one at a time with explicit
   paths, e.g.:

   ```bash
   rm "/Users/baykov/Documents/Autodrome/Projects/Autodrome-frontend/path/to/Foo 2.tsx"
   ```

3. Re-run the preview from 5a and confirm the output is empty
   before continuing to step 6.

If you are unsure about a file, stop the release and resolve
the ambiguity with the author — do not delete.

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
