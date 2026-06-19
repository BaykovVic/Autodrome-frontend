import type {
  ApiAdapterMode,
  ApiAdapterOptions,
  AutodromeApi,
} from "./adapter";
import { createLiveAdapter } from "./live";
import { createMockAdapter } from "./mock/adapter";
import {
  DEFAULT_SCENARIO,
  type MockScenario,
  isMockScenario,
} from "./mock/scenarios";

function resolveMode(explicit?: ApiAdapterMode): ApiAdapterMode {
  if (explicit) return explicit;
  const envMode = process.env.NEXT_PUBLIC_API_ADAPTER;
  return envMode === "mock" ? "mock" : "live";
}

function resolveScenario(explicit?: MockScenario): MockScenario {
  if (explicit) return explicit;
  const envScenario = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  return isMockScenario(envScenario) ? envScenario : DEFAULT_SCENARIO;
}

/**
 * Returns an `AutodromeApi` adapter for the current environment.
 *
 * Resolution order:
 *  1. Explicit `mode` in options (highest priority);
 *  2. `NEXT_PUBLIC_API_ADAPTER` env var (`"mock"` switches to mock,
 *     anything else stays on live);
 *  3. Default — `"live"`.
 *
 * For `"mock"` mode the scenario is resolved similarly from
 * `options.scenario` -> `NEXT_PUBLIC_MOCK_SCENARIO` env var ->
 * `DEFAULT_SCENARIO`. Consumers should depend only on `AutodromeApi`,
 * not on the concrete adapter, so swapping live/mock requires no
 * call-site changes.
 */
export function getApiAdapter(
  options: ApiAdapterOptions = {},
): AutodromeApi {
  const mode = resolveMode(options.mode);
  if (mode === "mock") {
    const scenario = resolveScenario(options.scenario);
    return createMockAdapter(scenario);
  }
  return createLiveAdapter();
}
