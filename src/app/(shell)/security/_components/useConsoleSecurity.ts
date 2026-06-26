"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleSecurityFor } from "./consoleSecurityFixtures";
import { liveSecurityLoader } from "./liveSecurityLoader";
import type { ConsoleSecuritySnapshot } from "./consoleSecuritySnapshot";

export type ConsoleSecurityLoader = () =>
  | ConsoleSecuritySnapshot
  | Promise<ConsoleSecuritySnapshot>;

export type ConsoleSecurityState = {
  loading: boolean;
  snapshot: ConsoleSecuritySnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(): Promise<ConsoleSecuritySnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveSecurityLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleSecurityFor(scenario);
}

export function useConsoleSecurity(
  loader?: ConsoleSecurityLoader,
): ConsoleSecurityState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleSecuritySnapshot | null>(null);
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
