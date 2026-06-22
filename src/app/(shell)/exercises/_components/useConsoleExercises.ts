"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleExercisesFor } from "./consoleExercisesFixtures";
import { liveExercisesLoader } from "./liveExerciseLoader";
import type { ConsoleExercisesSnapshot } from "./consoleExercisesSnapshot";

export type ConsoleExercisesLoader = () =>
  | ConsoleExercisesSnapshot
  | Promise<ConsoleExercisesSnapshot>;

export type ConsoleExercisesState = {
  loading: boolean;
  snapshot: ConsoleExercisesSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(): Promise<ConsoleExercisesSnapshot> {
  // Live mode: route through the typed exercise-service client.
  // Mock mode (default): keep using scenario fixtures so `pnpm dev`
  // and gates stay backend-free.
  if (resolveRuntimeMode() === "live") {
    return liveExercisesLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleExercisesFor(scenario);
}

export function useConsoleExercises(
  loader?: ConsoleExercisesLoader,
): ConsoleExercisesState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleExercisesSnapshot | null>(null);
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
