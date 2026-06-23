"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { consoleAndroidDevicesFor } from "./consoleAndroidDevicesFixtures";
import type { ConsoleAndroidDevicesSnapshot } from "./consoleAndroidDevicesSnapshot";

export type ConsoleAndroidDevicesLoader = () =>
  | ConsoleAndroidDevicesSnapshot
  | Promise<ConsoleAndroidDevicesSnapshot>;

export type ConsoleAndroidDevicesState = {
  loading: boolean;
  snapshot: ConsoleAndroidDevicesSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

function defaultLoader(): ConsoleAndroidDevicesSnapshot {
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleAndroidDevicesFor(scenario);
}

/**
 * Mock-first Android Devices hook. Mirrors the pattern used by
 * `useConsoleVehicles` / `useConsoleExams` before live API
 * integration shipped; live mode wiring lands in
 * `feature/frontend-android-device-management-live-api-integration`.
 */
export function useConsoleAndroidDevices(
  loader?: ConsoleAndroidDevicesLoader,
): ConsoleAndroidDevicesState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleAndroidDevicesSnapshot | null>(null);
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
