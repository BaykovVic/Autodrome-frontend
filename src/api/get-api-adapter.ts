import type { ApiAdapterOptions, AutodromeApi } from "./adapter";
import { createLiveAdapter } from "./live";
import { createMockAdapter } from "./mock/adapter";
import { DEFAULT_SCENARIO } from "./mock/scenarios";
import {
  resolveLiveBaseUrls,
  resolveRuntimeConfig,
  resolveRuntimeMode,
  summarizeRuntimeConfig,
  type RuntimeDiagnostics,
} from "./runtime-config";

/**
 * Returns an `AutodromeApi` adapter for the current runtime config.
 *
 * Resolution:
 *  1. Explicit `options.mode` wins. For `mock`, an explicit
 *     `options.scenario` overrides env.
 *  2. Otherwise `resolveRuntimeMode()` reads
 *     `NEXT_PUBLIC_API_ADAPTER`. Any value other than `"live"` —
 *     including missing — resolves to `"mock"`, making a fresh
 *     `pnpm dev` development-safe.
 *  3. For live mode with invalid per-service base URLs the adapter
 *     still constructs live clients using whatever URLs validated;
 *     misconfigured services keep their `/api/<service>/v1`
 *     defaults so the page does not crash. The degraded state is
 *     surfaced through `getRuntimeDiagnostics()` and the operations
 *     diagnostics panel.
 *
 * Consumers depend only on `AutodromeApi`, so swapping mode requires
 * no call-site changes.
 */
export function getApiAdapter(
  options: ApiAdapterOptions = {},
): AutodromeApi {
  if (options.mode === "mock") {
    return createMockAdapter(options.scenario ?? DEFAULT_SCENARIO);
  }
  if (options.mode === "live") {
    const { baseUrls } = resolveLiveBaseUrls();
    return createLiveAdapter(baseUrls);
  }

  const envMode = resolveRuntimeMode();
  if (envMode === "mock") {
    const config = resolveRuntimeConfig();
    return createMockAdapter(
      config.mode === "mock" ? config.scenario : DEFAULT_SCENARIO,
    );
  }
  const { baseUrls } = resolveLiveBaseUrls();
  return createLiveAdapter(baseUrls);
}

/**
 * Safe runtime config snapshot for diagnostics UI. Never returns
 * secrets; only exposes mode, scenario and per-service base URLs.
 */
export function getRuntimeDiagnostics(): RuntimeDiagnostics {
  return summarizeRuntimeConfig(resolveRuntimeConfig());
}
