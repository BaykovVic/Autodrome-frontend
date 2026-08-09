"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";

import {
  liveVehicleAnchorOptions,
  mockVehicleAnchorOptions,
  type VehicleAnchorOption,
} from "./vehicleAnchorOptions";

export type VehicleAnchorOptionsLoader = () =>
  | VehicleAnchorOption[]
  | Promise<VehicleAnchorOption[]>;

export type VehicleAnchorOptionsState = {
  /**
   * `idle` until the picker is actually needed (the dialog is closed
   * or the operator picked a non-vehicle binding type) — the vehicle
   * list is not fetched for assignments that never touch it.
   */
  phase: "idle" | "loading" | "ready" | "error";
  options: readonly VehicleAnchorOption[];
  /** Raw failure — the caller classifies it through the taxonomy. */
  error: unknown | null;
  reload: () => void;
};

export function defaultVehicleAnchorOptionsLoader(): Promise<
  VehicleAnchorOption[]
> {
  if (resolveRuntimeMode() === "live") {
    return liveVehicleAnchorOptions(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  // Mock mode never touches the network — fixtures only.
  return Promise.resolve(mockVehicleAnchorOptions(scenario));
}

/**
 * Loads the vehicle anchor options for the assign dialog.
 *
 * Only fetches while `enabled` is true so opening the dialog for a
 * `registrar` assignment (reception point / workstation anchors)
 * costs no `vehicle-service` call. Disabling resets the state to
 * `idle` rather than keeping a stale list around.
 */
export function useVehicleAnchorOptions(options: {
  enabled: boolean;
  loader?: VehicleAnchorOptionsLoader;
}): VehicleAnchorOptionsState {
  const { enabled, loader } = options;
  const [phase, setPhase] =
    useState<VehicleAnchorOptionsState["phase"]>("idle");
  const [items, setItems] = useState<readonly VehicleAnchorOption[]>([]);
  const [error, setError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

  // The loader is read through a ref and deliberately kept out of the
  // effect deps: callers (and tests) routinely pass an inline arrow,
  // whose identity changes every render and would otherwise re-fetch
  // in a loop. Re-fetching on demand is `reload()`; the switch that
  // matters — whether the picker is needed at all — is `enabled`.
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        setPhase("idle");
        setItems([]);
        setError(null);
        return;
      }

      setPhase("loading");
      setError(null);

      const activeLoader = loaderRef.current;
      try {
        const value = await (activeLoader
          ? activeLoader()
          : defaultVehicleAnchorOptionsLoader());
        if (cancelled) return;
        setItems(value);
        setPhase("ready");
      } catch (caught) {
        if (cancelled) return;
        setError(caught);
        setPhase("error");
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  return { phase, options: items, error, reload };
}
