"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { consoleExamsFor } from "./consoleExamsFixtures";
import type { ConsoleExamsSnapshot } from "./consoleExamsSnapshot";

export type ConsoleExamsLoader = () =>
  | ConsoleExamsSnapshot
  | Promise<ConsoleExamsSnapshot>;

export type ConsoleExamsState = {
  loading: boolean;
  snapshot: ConsoleExamsSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

function defaultLoader(): ConsoleExamsSnapshot {
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleExamsFor(scenario);
}

export function useConsoleExams(
  loader?: ConsoleExamsLoader,
): ConsoleExamsState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleExamsSnapshot | null>(null);
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
