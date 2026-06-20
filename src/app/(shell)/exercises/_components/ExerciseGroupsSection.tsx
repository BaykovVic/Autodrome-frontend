"use client";

import { useEffect, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  DegradedState,
  EmptyState,
  Skeleton,
  StatusBadge,
} from "@/components";
import { ExerciseGroupCreateForm } from "./ExerciseGroupCreateForm";
import type { Exercise } from "./useExercisesData";
import {
  useExerciseGroupsData,
  type ExerciseGroup,
} from "./useExerciseGroupsData";
import styles from "./ExerciseGroupsSection.module.css";

type Props = {
  api: AutodromeApi;
  exercises: Exercise[];
};

export function ExerciseGroupsSection({ api, exercises }: Props) {
  const state = useExerciseGroupsData(api);
  const [createOpen, setCreateOpen] = useState(false);
  // Keep a local list so newly-created groups appear without a refetch.
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);

  // Mirror loader-provided groups so locally created groups can sit alongside
  // server-loaded ones without forcing a refetch. Codex flagged the earlier
  // `useMemo` side-effect variant; this is the explicit `useEffect` mirror.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mirror cache
    setGroups(state.groups);
  }, [state.groups]);

  return (
    <section className={styles.section} aria-label="Exercise groups">
      <header className={styles.header}>
        <h2 className={styles.heading}>Exercise groups</h2>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={state.reload}>
            Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            New group…
          </Button>
        </div>
      </header>

      {state.degraded ? (
        <DegradedState service="exercise-service · groups" onRetry={state.reload} />
      ) : null}

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      {state.loading ? (
        <Skeleton lines={3} label="Loading exercise groups" />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No exercise groups"
          description="Compose published exercises into a group to use during exams."
        />
      ) : (
        <ul className={styles.list}>
          {groups.map((group) => (
            <li key={group.groupId} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.title}>{group.title}</span>
                <StatusBadge>{group.exerciseOrder.length} items</StatusBadge>
              </div>
              <p className={styles.itemMeta}>
                <span className={styles.mono}>{group.groupId}</span>
              </p>
            </li>
          ))}
        </ul>
      )}

      <ExerciseGroupCreateForm
        api={api}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        exercises={exercises}
        onSuccess={(group) => setGroups((prev) => [group, ...prev])}
      />
    </section>
  );
}
