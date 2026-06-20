import { ApiError } from "@/api/errors";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import type { ServiceHealth } from "./serviceHealth";
import { serviceHealthFor } from "./serviceHealthFixtures";

/**
 * Returns a current snapshot of service health/readiness fixtures.
 *
 * The backend does not yet expose a single aggregator endpoint for
 * service health. Each service exposes its own probe, but the local
 * node does not yet provide a combined read model. Until that lands,
 * the dashboard reads workspace-local fixtures keyed by mock
 * scenario; once an aggregator endpoint is added to the canonical
 * contracts, this loader should switch to a typed adapter call.
 */
export function defaultServiceHealthLoader(
  scenario?: MockScenario,
): ServiceHealth[] {
  const resolved = scenario ?? resolveScenarioFromEnv();
  return serviceHealthFor(resolved);
}

/**
 * A loader factory used by the workspace to surface a degraded
 * banner if the backend aggregator endpoint eventually returns 5xx.
 * Tests use this directly to drive the DegradedState primitive.
 */
export function makeFailingLoader(status: number, code: string, message: string) {
  return () => {
    throw new ApiError({
      status,
      code,
      message,
      url: "/api/operations/v1/service-health",
    });
  };
}

function resolveScenarioFromEnv(): MockScenario {
  const candidate = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  return isMockScenario(candidate) ? candidate : DEFAULT_SCENARIO;
}
