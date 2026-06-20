"use client";

import { useEffect, useMemo, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { getApiAdapter } from "@/api/get-api-adapter";
import {
  ApiErrorView,
  Button,
  DegradedState,
  EmptyState,
  Skeleton,
} from "@/components";
import {
  DEFAULT_FILTERS,
  applyExerciseFilters,
  type ExerciseFilterState,
} from "./applyExerciseFilters";
import { ExerciseCreateForm } from "./ExerciseCreateForm";
import { ExerciseDetail } from "./ExerciseDetail";
import { ExerciseFilters } from "./ExerciseFilters";
import { ExerciseGroupsSection } from "./ExerciseGroupsSection";
import { ExercisesTable } from "./ExercisesTable";
import { useExercisesData, type Exercise } from "./useExercisesData";
import styles from "./ExerciseWorkspace.module.css";

type Props = {
  api?: AutodromeApi;
};

export function ExerciseWorkspace({ api }: Props) {
  const resolvedApi = useMemo(() => api ?? getApiAdapter(), [api]);
  const state = useExercisesData(resolvedApi);

  const [filters, setFilters] = useState<ExerciseFilterState>(
    DEFAULT_FILTERS,
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );
  const [createOpen, setCreateOpen] = useState(false);

  // Local in-memory mirror so create/publish updates show up immediately
  // without a refetch. Codex's prior review flagged using a `useMemo`
  // side-effect; this is the explicit `useEffect` mirror cache.
  const [exercises, setExercises] = useState<Exercise[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mirror cache
    setExercises(state.exercises);
  }, [state.exercises]);

  const visible = useMemo(
    () => applyExerciseFilters(exercises, filters),
    [exercises, filters],
  );

  const selected: Exercise | undefined = useMemo(
    () => exercises.find((e) => e.exerciseId === selectedId) ?? undefined,
    [exercises, selectedId],
  );

  function patchExercise(next: Partial<Exercise> & { exerciseId: string }) {
    // Spread-merge defends against partial mutation responses: even if a
    // backend (or mock) handler only returns the changed subset, we keep
    // identity/required fields like `code`, `title`, `createdAt` from the
    // local row. Required by canonical `Exercise` schema.
    setExercises((prev) =>
      prev.map((row) =>
        row.exerciseId === next.exerciseId
          ? ({ ...row, ...next } as Exercise)
          : row,
      ),
    );
  }

  return (
    <section className={styles.workspace} aria-label="Exercise workspace">
      <header className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Exercises</h1>
          <p className={styles.subtitle}>
            Catalog through
            <span className={styles.mono}>
              {' api.exercise.GET("/exercises")'}
            </span>
            . Create / publish / groups via typed POSTs.
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={state.reload}>
            Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Create exercise
          </Button>
        </div>
      </header>

      {state.degraded ? (
        <DegradedState
          service="exercise-service · exercises"
          onRetry={state.reload}
        />
      ) : null}

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      <ExerciseFilters
        value={filters}
        onChange={setFilters}
        totalCount={exercises.length}
        matchedCount={visible.length}
      />

      <div className={styles.body}>
        <div className={styles.listColumn}>
          {state.loading ? (
            <Skeleton lines={6} label="Loading exercises" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No exercises"
              description={
                exercises.length === 0
                  ? "No exercises in this scenario."
                  : "No exercises match current filters."
              }
            />
          ) : (
            <ExercisesTable
              exercises={visible}
              selectedId={selectedId}
              onSelect={(exercise) => setSelectedId(exercise.exerciseId)}
            />
          )}
        </div>
        {selected ? (
          <ExerciseDetail
            api={resolvedApi}
            exercise={selected}
            onClose={() => setSelectedId(undefined)}
            onUpdated={(next) => patchExercise(next)}
          />
        ) : null}
      </div>

      <ExerciseGroupsSection api={resolvedApi} exercises={exercises} />

      <ExerciseCreateForm
        api={resolvedApi}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(exercise) =>
          setExercises((prev) => [exercise as Exercise, ...prev])
        }
      />
    </section>
  );
}
