"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { consoleViolationsFor } from "./consoleViolationsFixtures";
import type { ConsoleViolationsSnapshot } from "./consoleViolationsSnapshot";

export type ConsoleViolationsLoader = () =>
  | ConsoleViolationsSnapshot
  | Promise<ConsoleViolationsSnapshot>;

export type ConsoleViolationsState = {
  loading: boolean;
  snapshot: ConsoleViolationsSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

function defaultLoader(): ConsoleViolationsSnapshot {
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleViolationsFor(scenario);
}

export function useConsoleViolations(
  loader?: ConsoleViolationsLoader,
): ConsoleViolationsState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleViolationsSnapshot | null>(null);
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
