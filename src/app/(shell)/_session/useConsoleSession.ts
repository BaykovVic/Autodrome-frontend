"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";

import type {
  ConsoleSessionResult,
  ConsoleSessionState,
} from "./consoleSession";
import { consoleSessionFor } from "./consoleSessionFixtures";
import { liveSessionLoader } from "./liveSessionLoader";

export type ConsoleSessionLoader = () =>
  | ConsoleSessionResult
  | Promise<ConsoleSessionResult>;

export type UseConsoleSession = ConsoleSessionState & {
  reload: () => void;
};

async function defaultLoader(): Promise<ConsoleSessionResult> {
  if (resolveRuntimeMode() === "live") {
    return liveSessionLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleSessionFor(scenario);
}

/**
 * Mock-first session hook. Starts in `loading`, resolves to
 * `authenticated` / `unauthenticated`, or `error` when the session
 * loader throws (transport failure). A `loader` can be injected for
 * tests; otherwise the runtime mode picks the mock fixture or the
 * live `/auth/me` loader.
 */
export function useConsoleSession(
  loader?: ConsoleSessionLoader,
): UseConsoleSession {
  const [state, setState] = useState<ConsoleSessionState>({
    phase: "loading",
  });
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ phase: "loading" });
      try {
        const result = await (loader ? loader() : defaultLoader());
        if (cancelled) return;
        setState(
          result.status === "authenticated"
            ? { phase: "authenticated", actor: result.actor }
            : { phase: "unauthenticated", reason: result.reason },
        );
      } catch (error) {
        if (cancelled) return;
        setState({ phase: "error", error });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [loader, tick]);

  return { ...state, reload };
}
