import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";

import { consoleDashboardFor } from "./consoleDashboardFixtures";
import type { ConsoleDashboardSnapshot } from "./consoleDashboardSnapshot";
import { liveDashboardLoader } from "./liveDashboardLoader";

/**
 * Returns a current snapshot for the Autodrome console dashboard.
 *
 * Live mode reads the canonical `api-gateway-bff` dashboard read
 * models (`GET /dashboard/admin` / `GET /dashboard/dispatcher`),
 * selected by the current session roles. Blocks the BFF does not
 * expose (database readiness, media storage, telemetry, outbox)
 * resolve to `null` and render an explicit "no data from backend"
 * tile — live mode never falls back to fixtures.
 *
 * Mock mode keeps reading scenario-keyed fixtures unchanged, so
 * scenario-driven tests and the browser smoke are unaffected.
 */
export function defaultConsoleDashboardLoader(
  roles: readonly string[] = [],
  scenario?: MockScenario,
): ConsoleDashboardSnapshot | Promise<ConsoleDashboardSnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveDashboardLoader(getApiAdapter({ mode: "live" }), roles);
  }
  const resolved = scenario ?? resolveScenarioFromEnv();
  return consoleDashboardFor(resolved);
}

function resolveScenarioFromEnv(): MockScenario {
  const candidate = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  return isMockScenario(candidate) ? candidate : DEFAULT_SCENARIO;
}
