"use client";

import { useCallback, useEffect, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { components } from "@/contracts/types/candidate";

export type Candidate = components["schemas"]["Candidate"];
export type CandidateStatus = Candidate["status"];

type Loaded = {
  loading: false;
  candidates: Candidate[];
  fatalError: null;
  degraded: false;
};

type Loading = {
  loading: true;
  candidates: Candidate[];
  fatalError: null;
  degraded: false;
};

type Failed = {
  loading: false;
  candidates: Candidate[];
  fatalError: unknown;
  degraded: boolean;
};

export type CandidatesState = (Loaded | Loading | Failed) & {
  reload: () => void;
};

const EMPTY: Candidate[] = [];

export function useCandidatesData(api: AutodromeApi): CandidatesState {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>(EMPTY);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError(null);
      setDegraded(false);
      try {
        const response = await api.candidate.GET("/candidates", {
          params: { query: { pageSize: 200 } },
        });
        if (cancelled) return;
        const items = (response.data?.items ?? []) as Candidate[];
        setCandidates(items);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        // 5xx → degraded (UI остается читаемым с empty list), 4xx и прочее → fatal.
        if (
          error instanceof ApiError &&
          error.status >= 500
        ) {
          setDegraded(true);
          setCandidates(EMPTY);
          setLoading(false);
          return;
        }
        setFatalError(error);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [api, tick]);

  return {
    loading,
    candidates,
    fatalError,
    degraded,
    reload,
  } as CandidatesState;
}
