import {
  OUTCOME_LABELS,
  formatExamResultScore,
  type ConsoleExamOutcome,
  type ConsoleExamResultSnapshot,
} from "./consoleExamResult";

export type ExamResultFixtureKind =
  | "passed"
  | "failed"
  | "absent";

export function consoleExamResultFixture(
  examId: string,
  kind: ExamResultFixtureKind,
): ConsoleExamResultSnapshot {
  if (kind === "absent") {
    return { examId, status: "absent" };
  }
  const outcome: ConsoleExamOutcome = kind;
  const score = outcome === "passed" ? 92 : 41;
  return {
    examId,
    status: "ready",
    outcome,
    outcomeLabel: OUTCOME_LABELS[outcome],
    score,
    scoreLabel: formatExamResultScore(score),
    violationCount: outcome === "passed" ? 1 : 4,
    criticalViolationCount: outcome === "passed" ? 0 : 1,
    calculatedFromStatus: outcome === "passed" ? "finished" : "finished",
    calculatedAt: "2026-06-28T09:35:00Z",
  };
}
