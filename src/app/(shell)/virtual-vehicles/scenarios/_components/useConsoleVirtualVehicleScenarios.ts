"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { consoleVirtualVehicleScenariosFor } from "./consoleVirtualVehicleScenariosFixtures";
import type { ConsoleVirtualVehicleScenariosSnapshot } from "./consoleVirtualVehicleScenariosSnapshot";

export type ConsoleVirtualVehicleScenariosLoader = () =>
  | ConsoleVirtualVehicleScenariosSnapshot
  | Promise<ConsoleVirtualVehicleScenariosSnapshot>;

export type ConsoleVirtualVehicleScenariosState = {
  loading: boolean;
  snapshot: ConsoleVirtualVehicleScenariosSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

function defaultLoader(): ConsoleVirtualVehicleScenariosSnapshot {
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleVirtualVehicleScenariosFor(scenario);
}

/**
 * Mock-first virtual-vehicle scenario catalog hook. Mirrors the
 * VirtualVehicles workspace baseline hook so Track 3 live API
 * integration can drop in `resolveRuntimeMode()` switch without
 * touching screen code.
 */
export function useConsoleVirtualVehicleScenarios(
  loader?: ConsoleVirtualVehicleScenariosLoader,
): ConsoleVirtualVehicleScenariosState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleVirtualVehicleScenariosSnapshot | null>(null);
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
