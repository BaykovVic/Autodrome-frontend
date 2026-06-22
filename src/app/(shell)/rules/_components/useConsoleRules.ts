"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleRulesFor } from "./consoleRulesFixtures";
import { liveRulesLoader } from "./liveRulesLoader";
import type { ConsoleRulesSnapshot } from "./consoleRulesSnapshot";

export type ConsoleRulesLoader = () =>
  | ConsoleRulesSnapshot
  | Promise<ConsoleRulesSnapshot>;

export type ConsoleRulesState = {
  loading: boolean;
  snapshot: ConsoleRulesSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(): Promise<ConsoleRulesSnapshot> {
  // Live mode: route through the typed violation-rule-service client.
  // Mock mode (default): keep using scenario fixtures so `pnpm dev`
  // and gates stay backend-free.
  if (resolveRuntimeMode() === "live") {
    return liveRulesLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleRulesFor(scenario);
}

export function useConsoleRules(
  loader?: ConsoleRulesLoader,
): ConsoleRulesState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleRulesSnapshot | null>(null);
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
