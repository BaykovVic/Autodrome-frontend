"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleVehiclesFor } from "./consoleRegistryFixtures";
import { liveVehiclesLoader } from "./liveVehiclesLoader";
import type { ConsoleVehiclesSnapshot } from "./consoleRegistrySnapshot";

export type ConsoleVehiclesLoader = () =>
  | ConsoleVehiclesSnapshot
  | Promise<ConsoleVehiclesSnapshot>;

export type ConsoleVehiclesState = {
  loading: boolean;
  snapshot: ConsoleVehiclesSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(): Promise<ConsoleVehiclesSnapshot> {
  // Live mode: route through the typed vehicle-service client.
  // Mock mode (default): keep using the scenario fixtures.
  if (resolveRuntimeMode() === "live") {
    return liveVehiclesLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleVehiclesFor(scenario);
}

export function useConsoleVehicles(
  loader?: ConsoleVehiclesLoader,
): ConsoleVehiclesState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleVehiclesSnapshot | null>(null);
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
