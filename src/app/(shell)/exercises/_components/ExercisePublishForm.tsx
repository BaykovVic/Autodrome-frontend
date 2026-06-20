"use client";

import { useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  Input,
  StatusBadge,
} from "@/components";
import type { components } from "@/contracts/types/exercise";
import type { Exercise } from "./useExercisesData";
import styles from "./ExercisePublishForm.module.css";

type ExerciseVersionDraft = components["schemas"]["ExerciseVersionDraft"];

type Props = {
  api: AutodromeApi;
  exercise: Exercise;
  onPublished: (next: Exercise) => void;
};

export function ExercisePublishForm({
  api,
  exercise,
  onPublished,
}: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const canPublish = exercise.status === "draft";

  async function callPublish() {
    setSubmitting(true);
    setError(null);
    try {
      const body: ExerciseVersionDraft = {
        rulesRefs: [],
        geometryRefs: [],
        errors: [],
      };
      if (notes.trim()) body.notes = notes.trim();
      const { data } = await api.exercise.POST(
        "/exercises/{exerciseId}/publish",
        {
          params: {
            path: { exerciseId: exercise.exerciseId },
            header: { "Idempotency-Key": crypto.randomUUID() },
          },
          body,
        },
      );
      if (data) {
        onPublished(data as Exercise);
        setOpen(false);
        setNotes("");
      }
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  }

  if (!canPublish) {
    return (
      <p className={styles.locked}>
        <StatusBadge>
          {exercise.status === "published"
            ? "already published"
            : "archived"}
        </StatusBadge>
        <span>Publish action is available only for draft exercises.</span>
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      {error ? <ApiErrorView error={error} /> : null}
      {!open ? (
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={() => setOpen(true)}
        >
          Publish…
        </Button>
      ) : (
        <div className={styles.subForm}>
          <p className={styles.note}>
            Publishing snapshots an empty version draft
            <span className={styles.mono}> (rulesRefs/geometryRefs/errors = [])</span>
            . Rule binding and geometry authoring are intentionally out of
            scope for this baseline.
          </p>
          <Input
            id="publish-notes"
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className={styles.footer}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setOpen(false);
                setNotes("");
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={submitting}
              onClick={callPublish}
            >
              {submitting ? "Publishing…" : "Submit publish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
