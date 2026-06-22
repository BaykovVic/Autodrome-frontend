"use client";

import { useCallback, useEffect, useState } from "react";

import {
  consoleEnrollmentSessionFor,
  isEnrollmentSessionScenario,
} from "./consoleEnrollmentSessionFixtures";
import type {
  EnrollmentSessionScenario,
  EnrollmentSessionSnapshot,
} from "./consoleEnrollmentSession";

export type ConsoleEnrollmentSessionLoader = () =>
  | EnrollmentSessionSnapshot
  | Promise<EnrollmentSessionSnapshot>;

export type ConsoleEnrollmentSessionState = {
  loading: boolean;
  snapshot: EnrollmentSessionSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

const DEFAULT_SCENARIO: EnrollmentSessionScenario = "capturing";

function defaultLoader(): EnrollmentSessionSnapshot {
  // The enrollment-session scenario is intentionally independent
  // from the global mock scenario — it can be flipped per surface
  // via `NEXT_PUBLIC_ENROLLMENT_SESSION_SCENARIO` so demos can pin
  // a specific state without affecting the wider mock adapter.
  const env = process.env.NEXT_PUBLIC_ENROLLMENT_SESSION_SCENARIO;
  const scenario: EnrollmentSessionScenario = isEnrollmentSessionScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleEnrollmentSessionFor(scenario);
}

export function useConsoleEnrollmentSession(
  loader?: ConsoleEnrollmentSessionLoader,
): ConsoleEnrollmentSessionState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<EnrollmentSessionSnapshot | null>(null);
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
