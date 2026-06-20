import { defineConfig, devices } from "@playwright/test";

/**
 * Browser smoke configuration for the frontend shell.
 *
 * The smoke is intentionally minimal: one Chromium project, single
 * worker, retain trace only on failure. It does not replace any
 * existing unit / component / Vitest smoke test — those still run
 * under `pnpm release-gate`. Browser smoke is a separate, opt-in
 * gate because it needs a one-shot Chromium download
 * (`pnpm e2e:install`) that we do not want to put behind the
 * default release gate.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    // The build behind this server must already have been produced
    // with NEXT_PUBLIC_API_ADAPTER=mock baked in — see the `e2e:build`
    // script. `next start` reads the prebuilt `.next/` output; the
    // env vars below are forwarded for any server-side use but do
    // NOT replace the build-time bake-in.
    command: `pnpm exec next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_API_ADAPTER: "mock",
      NEXT_PUBLIC_MOCK_SCENARIO: "normal",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
