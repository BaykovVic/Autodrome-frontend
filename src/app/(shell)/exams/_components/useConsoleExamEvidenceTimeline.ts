"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";

import type { ConsoleEvidenceTimelineSnapshot } from "./consoleExamEvidenceTimeline";
import { consoleExamEvidenceTimelineFor } from "./consoleExamEvidenceTimelineFixtures";
import { liveExamEvidenceTimeline } from "./liveExamEvidenceTimelineLoader";

export type ConsoleExamEvidenceTimelineLoader = () =>
  | ConsoleEvidenceTimelineSnapshot
  | Promise<ConsoleEvidenceTimelineSnapshot>;

export type ConsoleExamEvidenceTimelineState = {
  loading: boolean;
  snapshot: ConsoleEvidenceTimelineSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

function defaultLoader(
  examId: string,
): ConsoleExamEvidenceTimelineLoader {
  return () => {
    if (resolveRuntimeMode() === "live") {
      return liveExamEvidenceTimeline(
        getApiAdapter({ mode: "live" }),
        examId,
      );
    }
    return consoleExamEvidenceTimelineFor(examId);
  };
}

export function useConsoleExamEvidenceTimeline(
  examId: string,
  loader?: ConsoleExamEvidenceTimelineLoader,
): ConsoleExamEvidenceTimelineState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleEvidenceTimelineSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const effective = loader ?? defaultLoader(examId);
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
  }, [loader, examId, tick]);

  return { loading, snapshot, fatalError, reload };
}
