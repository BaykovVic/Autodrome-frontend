"use client";

import {
  ApiErrorView,
  Button,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
} from "@/components";

import {
  outcomeTone,
  type ConsoleExamResultSnapshot,
} from "./consoleExamResult";
import {
  useConsoleExamResult,
  type ConsoleExamResultCalculator,
  type ConsoleExamResultGetter,
} from "./useConsoleExamResult";

import styles from "./ExamResultPanel.module.css";

type Props = {
  examId: string;
  /**
   * `true` when the exam lifecycle is at `finished` or `aborted`
   * (i.e. backend accepts calculate-result). Drives whether the
   * action is enabled or shown as a no-op note.
   */
  canCalculate: boolean;
  getter?: ConsoleExamResultGetter;
  calculator?: ConsoleExamResultCalculator;
};

function outcomeBadgeVariant(
  snapshot: ConsoleExamResultSnapshot,
): StatusBadgeVariant {
  if (snapshot.outcome === "passed") return "success";
  if (snapshot.outcome === "failed") return "danger";
  return "neutral";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function ExamResultPanel({
  examId,
  canCalculate,
  getter,
  calculator,
}: Props) {
  const state = useConsoleExamResult(examId, getter, calculator);

  if (state.loading) {
    return (
      <div
        className={styles.panel}
        aria-label={`Exam ${examId} result loading`}
      >
        <Skeleton lines={3} label="Loading exam result" />
      </div>
    );
  }

  if (state.fatalError) {
    return (
      <div className={styles.panel}>
        <ApiErrorView
          error={state.fatalError}
          onRetry={state.reload}
        />
      </div>
    );
  }

  const snapshot = state.snapshot;
  const calculateLabel = state.calculating
    ? "Calculating…"
    : snapshot?.status === "ready"
      ? "Recalculate"
      : "Calculate result";
  const calculateTitle = canCalculate
    ? snapshot?.status === "ready"
      ? "Re-run idempotent calculation (backend returns existing snapshot)."
      : "Calculate exam result via exam-service."
    : "Calculate is available after the exam lifecycle reaches finished or aborted.";

  return (
    <div className={styles.panel} aria-label={`Exam ${examId} result`}>
      {snapshot?.status === "absent" ? (
        <p className={styles.absent}>
          No result calculated yet for this exam.
        </p>
      ) : snapshot?.status === "ready" ? (
        <>
          <div className={styles.outcomeRow}>
            <StatusDot
              variant={outcomeTone(snapshot.outcome)}
              halo={false}
            />
            <StatusBadge variant={outcomeBadgeVariant(snapshot)}>
              {snapshot.outcomeLabel ?? snapshot.outcome ?? "—"}
            </StatusBadge>
          </div>
          <dl className={styles.metaGrid}>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Score</span>
              <span className={styles.metaValue}>
                {snapshot.scoreLabel ?? "—"}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Violations</span>
              <span className={styles.metaValue}>
                {snapshot.violationCount ?? 0}
                {snapshot.criticalViolationCount !== undefined
                  ? ` (critical ${snapshot.criticalViolationCount})`
                  : ""}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Calculated from</span>
              <span className={styles.metaValue}>
                {snapshot.calculatedFromStatus ?? "—"}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Calculated at</span>
              <span className={styles.metaValue}>
                {snapshot.calculatedAt ?? "—"}
              </span>
            </div>
          </dl>
        </>
      ) : null}

      {state.calculateError ? (
        <p className={styles.error} role="alert">
          Calculate failed: {errorMessage(state.calculateError)}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={() => {
            void state.calculate();
          }}
          disabled={!canCalculate || state.calculating}
          title={calculateTitle}
        >
          {calculateLabel}
        </Button>
      </div>
    </div>
  );
}
