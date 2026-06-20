"use client";

import { useCallback, useEffect, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { components } from "@/contracts/types/exercise";

export type Exercise = components["schemas"]["Exercise"];
export type ExerciseStatus = Exercise["status"];

export type ExercisesState = {
  loading: boolean;
  exercises: Exercise[];
  fatalError: unknown | null;
  degraded: boolean;
  reload: () => void;
};

const EMPTY: Exercise[] = [];

export function useExercisesData(api: AutodromeApi): ExercisesState {
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>(EMPTY);
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
        const response = await api.exercise.GET("/exercises", {
          params: { query: { pageSize: 200 } },
        });
        if (cancelled) return;
        const items = (response.data?.items ?? []) as Exercise[];
        setExercises(items);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status >= 500) {
          setDegraded(true);
          setExercises(EMPTY);
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

  return { loading, exercises, fatalError, degraded, reload };
}
