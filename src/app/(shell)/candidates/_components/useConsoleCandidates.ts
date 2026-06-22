"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleCandidatesFor } from "./consoleRegistryFixtures";
import { liveCandidatesLoader } from "./liveCandidatesLoader";
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

async function defaultLoader(): Promise<ConsoleCandidatesSnapshot> {
  // Live mode: route through the typed candidate-service client.
  // Mock mode (default): keep using the scenario fixtures — `pnpm
  // dev` and unit/e2e gates stay backend-free.
  if (resolveRuntimeMode() === "live") {
    return liveCandidatesLoader(getApiAdapter({ mode: "live" }));
  }
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
