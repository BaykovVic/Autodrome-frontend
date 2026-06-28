/**
 * Console-shaped exam-result snapshot.
 *
 * Backend (`exam-service`) owns scoring; frontend only reads and
 * (re)triggers idempotent calculation. The view-model adds
 * operator-friendly labels for outcome + a tone hint for the
 * StatusDot primitive so the result tile renders without ad-hoc
 * color logic in the screen.
 */

export type ConsoleExamOutcome = "passed" | "failed";

export type ConsoleExamResultStatus =
  | "absent"
  | "ready"
  | "calculating"
  | "error";

export type ConsoleExamResultSnapshot = {
  examId: string;
  status: ConsoleExamResultStatus;
  outcome?: ConsoleExamOutcome;
  outcomeLabel?: string;
  score?: number;
  scoreLabel?: string;
  violationCount?: number;
  criticalViolationCount?: number;
  calculatedFromStatus?: string;
  calculatedAt?: string;
  /** Last error code surfaced from `ApiError` (e.g. `EXAM_NOT_FINISHED`). */
  lastErrorCode?: string;
  lastErrorMessage?: string;
};

export const OUTCOME_LABELS: Record<ConsoleExamOutcome, string> = {
  passed: "Passed",
  failed: "Failed",
};

export function outcomeTone(
  outcome: ConsoleExamOutcome | undefined,
): "online" | "offline" | "standby" {
  if (outcome === "passed") return "online";
  if (outcome === "failed") return "offline";
  return "standby";
}

export function formatExamResultScore(
  score: number | undefined,
): string {
  if (typeof score !== "number") return "—";
  return String(score);
}
