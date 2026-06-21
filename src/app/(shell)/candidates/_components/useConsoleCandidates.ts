"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { consoleCandidatesFor } from "./consoleRegistryFixtures";
import type { ConsoleCandidatesSnapshot } from "./consoleRegistrySnapshot";

export type ConsoleCandidatesLoader = () =>
  | ConsoleCandidatesSnapshot
  | Promise<ConsoleCandidatesSnapshot>;

export type ConsoleCandidatesState = {
  loading: boolean;
  snapshot: ConsoleCandidatesSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

function defaultLoader(): ConsoleCandidatesSnapshot {
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleCandidatesFor(scenario);
}

export function useConsoleCandidates(
  loader?: ConsoleCandidatesLoader,
): ConsoleCandidatesState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleCandidatesSnapshot | null>(null);
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
