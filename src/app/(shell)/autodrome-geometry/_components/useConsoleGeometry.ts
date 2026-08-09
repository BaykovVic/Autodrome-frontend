"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";

import { consoleGeometryFor } from "./consoleGeometryFixtures";
import type { ConsoleGeometrySnapshot } from "./consoleGeometrySnapshot";
import { liveGeometryLoader } from "./liveGeometryLoader";

export type ConsoleGeometryLoader = () =>
  | ConsoleGeometrySnapshot
  | Promise<ConsoleGeometrySnapshot>;

export type ConsoleGeometryState = {
  loading: boolean;
  snapshot: ConsoleGeometrySnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(): Promise<ConsoleGeometrySnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveGeometryLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleGeometryFor(scenario);
}

/** Mock-first geometry hook (live reads autodrome-geometry-service). */
export function useConsoleGeometry(
  loader?: ConsoleGeometryLoader,
): ConsoleGeometryState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleGeometrySnapshot | null>(null);
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
