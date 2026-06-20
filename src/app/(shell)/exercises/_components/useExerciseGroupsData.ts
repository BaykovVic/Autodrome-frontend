"use client";

import { useCallback, useEffect, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { components } from "@/contracts/types/exercise";

export type ExerciseGroup = components["schemas"]["ExerciseGroup"];

export type ExerciseGroupsState = {
  loading: boolean;
  groups: ExerciseGroup[];
  fatalError: unknown | null;
  degraded: boolean;
  reload: () => void;
};

const EMPTY: ExerciseGroup[] = [];

export function useExerciseGroupsData(
  api: AutodromeApi,
): ExerciseGroupsState {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ExerciseGroup[]>(EMPTY);
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
        const response = await api.exercise.GET("/exercise-groups", {
          params: { query: { pageSize: 200 } },
        });
        if (cancelled) return;
        const items = (response.data?.items ?? []) as ExerciseGroup[];
        setGroups(items);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status >= 500) {
          setDegraded(true);
          setGroups(EMPTY);
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

  return { loading, groups, fatalError, degraded, reload };
}
