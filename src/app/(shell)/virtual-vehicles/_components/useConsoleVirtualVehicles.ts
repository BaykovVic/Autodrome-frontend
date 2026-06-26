"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleVirtualVehiclesFor } from "./consoleVirtualVehiclesFixtures";
import { liveVirtualVehiclesLoader } from "./liveVirtualVehiclesLoader";
import type { ConsoleVirtualVehiclesSnapshot } from "./consoleVirtualVehiclesSnapshot";

export type ConsoleVirtualVehiclesLoader = () =>
  | ConsoleVirtualVehiclesSnapshot
  | Promise<ConsoleVirtualVehiclesSnapshot>;

export type ConsoleVirtualVehiclesState = {
  loading: boolean;
  snapshot: ConsoleVirtualVehiclesSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(): Promise<ConsoleVirtualVehiclesSnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveVirtualVehiclesLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleVirtualVehiclesFor(scenario);
}

/**
 * Mock-first Virtual Vehicles hook (workspace baseline).
 *
 * Hook signature mirrors the established
 * `useConsoleAndroidDevices` shape (pre-live-integration) so
 * Track 3 can drop in `resolveRuntimeMode() === "live"` switch
 * без touching screen code. Live wiring is deferred to
 * `feature/frontend-virtual-vehicle-live-api-integration`
 * conditional on canonical OpenAPI shipping in backend repo.
 */
export function useConsoleVirtualVehicles(
  loader?: ConsoleVirtualVehiclesLoader,
): ConsoleVirtualVehiclesState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleVirtualVehiclesSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError(null);
      try {
        const value = await (loader ? loader() : defaultLoader());
        if (cancelled) return;
        setSnapshot(value);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        setFatalError(error);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [loader, tick]);

  return { loading, snapshot, fatalError, reload };
}
