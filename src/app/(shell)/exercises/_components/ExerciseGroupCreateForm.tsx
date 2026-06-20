"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  Input,
  Modal,
  StatusBadge,
  ValidationErrors,
  type ValidationIssue,
} from "@/components";
import type { components } from "@/contracts/types/exercise";
import type { Exercise } from "./useExercisesData";
import type { ExerciseGroup } from "./useExerciseGroupsData";
import styles from "./ExerciseGroupCreateForm.module.css";

type ExerciseGroupCreation = components["schemas"]["ExerciseGroupCreation"];

type Props = {
  api: AutodromeApi;
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onSuccess?: (group: ExerciseGroup) => void;
};

export function ExerciseGroupCreateForm({
  api,
  open,
  onClose,
  exercises,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<unknown | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const publishedExercises = useMemo(
    () => exercises.filter((e) => e.status === "published"),
    [exercises],
  );

  function reset() {
    setIssues([]);
    setServerError(null);
    setSuccessId(null);
  }

  function toggle(exerciseId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();

    const nextIssues: ValidationIssue[] = [];
    if (!title.trim()) {
      nextIssues.push({ field: "title", message: "Title is required" });
    }
    if (selected.size === 0) {
      nextIssues.push({
        field: "exerciseOrder",
        message: "Select at least one published exercise",
      });
    }
    setIssues(nextIssues);
    if (nextIssues.length > 0) return;

    const body: ExerciseGroupCreation = {
      title: title.trim(),
      exerciseOrder: Array.from(selected).map((exerciseId) => ({
        exerciseId,
      })),
      categoryRefs: [],
    };

    setSubmitting(true);
    try {
      const { data } = await api.exercise.POST("/exercise-groups", {
        params: {
          header: { "Idempotency-Key": crypto.randomUUID() },
        },
        body,
      });
      const group = data as ExerciseGroup | undefined;
      if (group?.groupId) {
        setSuccessId(group.groupId);
        setTitle("");
        setSelected(new Set());
        onSuccess?.(group);
      }
    } catch (error) {
      setServerError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      ariaLabel="Create a new exercise group"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <h2 className={styles.title}>Create exercise group</h2>
          <p className={styles.subtitle}>
            Picks already-published exercises into an
            <span className={styles.mono}> ExerciseGroupCreation</span>
            payload. Ordering and category authoring belong to a later
            feature.
          </p>
        </header>

        {issues.length > 0 ? <ValidationErrors issues={issues} /> : null}
        {serverError ? <ApiErrorView error={serverError} /> : null}
        {successId ? (
          <div className={styles.success}>
            <StatusBadge variant="success">created</StatusBadge>
            <span>
              New group id <span className={styles.mono}>{successId}</span>
            </span>
          </div>
        ) : null}

        <Input
          id="group-title"
          label="Group title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          invalid={issues.some((i) => i.field === "title")}
        />

        <fieldset
          className={styles.fieldset}
          aria-label="Pick published exercises"
        >
          <legend className={styles.legend}>Published exercises</legend>
          {publishedExercises.length === 0 ? (
            <p className={styles.empty}>
              No published exercises available. Publish a draft first.
            </p>
          ) : (
            <ul className={styles.list}>
              {publishedExercises.map((exercise) => {
                const checked = selected.has(exercise.exerciseId);
                return (
                  <li key={exercise.exerciseId} className={styles.row}>
                    <label className={styles.checkRow}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(exercise.exerciseId)}
                      />
                      <span className={styles.code}>{exercise.code}</span>
                      <span>{exercise.title}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        <footer className={styles.footer}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Create group"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
