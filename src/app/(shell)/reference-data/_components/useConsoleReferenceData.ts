"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";

import { consoleReferenceDataFor } from "./consoleReferenceDataFixtures";
import type { ConsoleReferenceDataSnapshot } from "./consoleReferenceDataSnapshot";
import { liveReferenceDataLoader } from "./liveReferenceDataLoader";

export type ConsoleReferenceDataLoader = () =>
  | ConsoleReferenceDataSnapshot
  | Promise<ConsoleReferenceDataSnapshot>;

export type ConsoleReferenceDataState = {
  loading: boolean;
  snapshot: ConsoleReferenceDataSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(): Promise<ConsoleReferenceDataSnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveReferenceDataLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleReferenceDataFor(scenario);
}

/** Mock-first reference-data hook (live reads reference-data-service). */
export function useConsoleReferenceData(
  loader?: ConsoleReferenceDataLoader,
): ConsoleReferenceDataState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleReferenceDataSnapshot | null>(null);
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
