"use client";

import { useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
  StatusBadge,
} from "@/components";
import type { components } from "@/contracts/types/exercise";
import type { Exercise } from "./useExercisesData";
import styles from "./ExerciseVersionDetail.module.css";

type ExerciseVersion = components["schemas"]["ExerciseVersion"];

type Props = {
  api: AutodromeApi;
  exercise: Exercise;
};

export function ExerciseVersionDetail({ api, exercise }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState<ExerciseVersion | null>(null);
  const [error, setError] = useState<unknown | null>(null);

  const current = exercise.currentVersion;

  if (!current) {
    return (
      <EmptyState
        title="No published version"
        description="Publish a draft to materialise an immutable ExerciseVersion."
      />
    );
  }

  async function loadVersion() {
    if (!current) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.exercise.GET(
        "/exercises/{exerciseId}/versions/{versionId}",
        {
          params: {
            path: {
              exerciseId: exercise.exerciseId,
              versionId: current.versionId,
            },
          },
        },
      );
      setVersion((data ?? null) as ExerciseVersion | null);
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.summary}>
        <StatusBadge variant="success">v{current.versionNumber}</StatusBadge>
        <span className={styles.mono}>{current.versionId}</span>
        {current.publishedAt ? (
          <span className={styles.meta}>at {current.publishedAt}</span>
        ) : null}
      </div>

      {!open ? (
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => {
            setOpen(true);
            loadVersion();
          }}
        >
          Show version detail
        </Button>
      ) : (
        <div className={styles.detail}>
          {loading ? (
            <Skeleton lines={3} label="Loading exercise version" />
          ) : error ? (
            <ApiErrorView error={error} onRetry={loadVersion} />
          ) : version ? (
            <dl className={styles.list}>
              <Row label="Rule refs">
                <span className={styles.mono}>
                  {version.rulesRefs?.length ?? 0}
                </span>
              </Row>
              <Row label="Geometry refs">
                <span className={styles.mono}>
                  {version.geometryRefs?.length ?? 0}
                </span>
              </Row>
              <Row label="Errors">
                <span className={styles.mono}>
                  {version.errors?.length ?? 0}
                </span>
              </Row>
              <Row label="Published at">
                <span className={styles.mono}>
                  {version.publishedAt ?? "—"}
                </span>
              </Row>
            </dl>
          ) : (
            <EmptyState
              title="No version body"
              description="Version endpoint returned no body."
            />
          )}
          <p className={styles.note}>
            Visual track/geometry editor and rule binding editor are
            intentionally out of scope here; this baseline only surfaces
            ref counts coming from the canonical
            <span className={styles.mono}> ExerciseVersion</span> schema.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{children}</dd>
    </div>
  );
}
