"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";

import type { ConsoleExamResultSnapshot } from "./consoleExamResult";
import { consoleExamResultFixture } from "./consoleExamResultFixtures";
import {
  liveExamResultCalculate,
  liveExamResultGet,
} from "./liveExamResultLoader";

export type ConsoleExamResultGetter = () =>
  | ConsoleExamResultSnapshot
  | Promise<ConsoleExamResultSnapshot>;

export type ConsoleExamResultCalculator = () =>
  | ConsoleExamResultSnapshot
  | Promise<ConsoleExamResultSnapshot>;

export type ConsoleExamResultState = {
  loading: boolean;
  snapshot: ConsoleExamResultSnapshot | null;
  fatalError: unknown | null;
  calculating: boolean;
  calculateError: unknown | null;
  calculate: () => Promise<void>;
  reload: () => void;
};

function defaultGetter(examId: string): ConsoleExamResultGetter {
  return () => {
    if (resolveRuntimeMode() === "live") {
      return liveExamResultGet(getApiAdapter({ mode: "live" }), examId);
    }
    // Default mock: surface a "ready" passed result so the panel
    // demonstrates layout out of the box.
    return consoleExamResultFixture(examId, "passed");
  };
}

function defaultCalculator(examId: string): ConsoleExamResultCalculator {
  return () => {
    if (resolveRuntimeMode() === "live") {
      return liveExamResultCalculate(
        getApiAdapter({ mode: "live" }),
        examId,
      );
    }
    // Mock: behave as idempotent — recompute returns same snapshot.
    return consoleExamResultFixture(examId, "passed");
  };
}

export function useConsoleExamResult(
  examId: string,
  getter?: ConsoleExamResultGetter,
  calculator?: ConsoleExamResultCalculator,
): ConsoleExamResultState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleExamResultSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calculateError, setCalculateError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const effective = getter ?? defaultGetter(examId);
    async function load() {
      setLoading(true);
      setFatalError(null);
      try {
        const value = await effective();
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
  }, [getter, examId, tick]);

  const calculate = useCallback(async () => {
    const fn = calculator ?? defaultCalculator(examId);
    setCalculating(true);
    setCalculateError(null);
    try {
      const value = await fn();
      setSnapshot(value);
    } catch (error) {
      setCalculateError(error);
    } finally {
      setCalculating(false);
    }
  }, [calculator, examId]);

  return {
    loading,
    snapshot,
    fatalError,
    calculating,
    calculateError,
    calculate,
    reload,
  };
}
