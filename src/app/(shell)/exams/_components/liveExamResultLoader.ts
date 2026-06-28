/**
 * Live exam-result loader + calculate command.
 *
 * Wires:
 *   - `GET /exams/{examId}/result` → `liveExamResultGet`
 *   - `POST /exams/{examId}/calculate-result` →
 *     `liveExamResultCalculate` (idempotent; same UUID per click).
 *
 * Per spec rule "Frontend не считает результат сам" — both
 * functions simply propagate exam-service responses; no local
 * scoring.
 *
 * Backend returns `404` until the exam has been calculated. The
 * loader translates `404` → an `absent` snapshot so the UI can
 * render a `Calculate` action without surfacing an alarming error
 * state. Every other error rethrows so the screen renders
 * `ApiErrorView`.
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import { ApiError } from "@/api/errors";
import type { components } from "@/contracts/types/exam";

import {
  formatExamResultScore,
  OUTCOME_LABELS,
  type ConsoleExamResultSnapshot,
} from "./consoleExamResult";

type ExamResultDto = components["schemas"]["ExamResult"];

export function mapExamResultDtoToConsole(
  examId: string,
  dto: ExamResultDto,
): ConsoleExamResultSnapshot {
  return {
    examId,
    status: "ready",
    outcome: dto.result,
    outcomeLabel: OUTCOME_LABELS[dto.result],
    score: dto.score,
    scoreLabel: formatExamResultScore(dto.score),
    violationCount: dto.violationCount,
    criticalViolationCount: dto.criticalViolationCount,
    calculatedFromStatus: dto.calculatedFromStatus,
    calculatedAt: dto.calculatedAt,
  };
}

export function absentExamResult(
  examId: string,
): ConsoleExamResultSnapshot {
  return { examId, status: "absent" };
}

export async function liveExamResultGet(
  adapter: AutodromeApi,
  examId: string,
): Promise<ConsoleExamResultSnapshot> {
  try {
    const result = await adapter.exam.GET(
      "/exams/{examId}/result",
      { params: { path: { examId } } },
    );
    const dto = result.data as ExamResultDto | undefined;
    if (!dto) {
      throw new Error("exam-service returned an empty body for result");
    }
    return mapExamResultDtoToConsole(examId, dto);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return absentExamResult(examId);
    }
    throw error;
  }
}

export async function liveExamResultCalculate(
  adapter: AutodromeApi,
  examId: string,
): Promise<ConsoleExamResultSnapshot> {
  const result = await adapter.exam.POST(
    "/exams/{examId}/calculate-result",
    {
      params: {
        path: { examId },
        header: { "Idempotency-Key": newCorrelationId() },
      },
    },
  );
  const dto = result.data as ExamResultDto | undefined;
  if (!dto) {
    throw new Error(
      "exam-service returned an empty body for calculate-result",
    );
  }
  return mapExamResultDtoToConsole(examId, dto);
}
