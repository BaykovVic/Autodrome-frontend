import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { consoleDashboardFor } from "./consoleDashboardFixtures";
import type { ConsoleDashboardSnapshot } from "./consoleDashboardSnapshot";

/**
 * Returns a current snapshot for the Autodrome console dashboard.
 *
 * The backend does not yet expose a single dashboard read model;
 * each widget block lives behind its own service. Until those
 * read models land, the dashboard reads workspace-local fixtures
 * keyed by mock scenario. When the contracts ship, swap each
 * block's source for a typed adapter call without touching the
 * widget components.
 */
export function defaultConsoleDashboardLoader(
  scenario?: MockScenario,
): ConsoleDashboardSnapshot {
  const resolved = scenario ?? resolveScenarioFromEnv();
  return consoleDashboardFor(resolved);
}

function resolveScenarioFromEnv(): MockScenario {
  const candidate = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  return isMockScenario(candidate) ? candidate : DEFAULT_SCENARIO;
}
