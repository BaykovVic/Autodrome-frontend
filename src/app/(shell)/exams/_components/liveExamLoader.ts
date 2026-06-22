/**
 * Live exam loader + DTO→view-model mapper + lifecycle commands.
 *
 * Wires the exams workspace to the typed `exam-service` client
 * (`api.exam.*`). Mock mode keeps using scenario fixtures — this
 * module is only used when `resolveRuntimeMode() === "live"`.
 *
 * Coverage vs. canonical contract (`@/contracts/types/exam`):
 *
 *   - `GET /exams` — **not in contract**. Exam-service exposes only
 *     POST /exams (create), GET /exams/{examId} (detail), the four
 *     lifecycle endpoints (start/finish/abort) and the timeline read.
 *     Until backend ships a list endpoint, `liveExamsLoader` returns
 *     an empty `ConsoleExamsSnapshot` so the workspace still renders
 *     (its EmptyState handles 0 rows). Documented as tech-debt in
 *     the report.
 *   - `GET /exams/{examId}` → `liveExamGet`.
 *   - `POST /exams` → `liveExamCreate`.
 *   - `POST /exams/{examId}/start` → `liveExamStart`.
 *   - `POST /exams/{examId}/finish` → `liveExamFinish`.
 *   - `POST /exams/{examId}/abort` → `liveExamAbort`.
 *   - `GET /exams/{examId}/timeline` → `liveExamTimeline`.
 *
 * Mapping notes:
 *
 *   - Backend `Exam` carries identity + lifecycle + outcome. The
 *     visual surface adds design-only blocks (route label, 4-quadrant
 *     metadata grid, full timeline narrative). Those default to
 *     safe placeholders (`"—"`, empty timeline) until backend ships
 *     read models for them.
 *   - Score is rendered as `"—"` until the exam has a numeric score;
 *     otherwise stringified.
 *   - Duration is approximated from `startedAt`/`finishedAt` when
 *     available; otherwise `"—"`.
 *   - Timeline events keep their canonical `eventType` mapped to a
 *     human-readable label and a status-dot ("online" / "degraded" /
 *     "offline" / "standby") so the existing visual timeline
 *     primitive renders without inventing severity colors.
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/exam";

import type {
  ConsoleExam,
  ConsoleExamState,
  ConsoleExamTimelineEntry,
  ConsoleExamsSnapshot,
} from "./consoleExamsSnapshot";

type ExamDto = components["schemas"]["Exam"];
type ExamStatus = components["schemas"]["ExamStatus"];
type ExamCreationDto = components["schemas"]["ExamCreation"];
type ExamStartDto = components["schemas"]["ExamStart"];
type ExamFinishDto = components["schemas"]["ExamFinish"];
type ExamAbortDto = components["schemas"]["ExamAbort"];
type ExamTimelineEventDto = components["schemas"]["ExamTimelineEvent"];
type ExamTimelinePageDto = components["schemas"]["ExamTimelinePage"];
type ExamTimelineEventType =
  components["schemas"]["ExamTimelineEventType"];

/**
 * Maps the canonical `ExamStatus` to the operator-facing
 * console-shaped state + label. The console enum is intentionally
 * narrower (no archived/etc.) so mapping is total via the
 * `Record<ExamStatus, …>` typing.
 */
const STATE_FOR_STATUS: Record<
  ExamStatus,
  { state: ConsoleExamState; label: string }
> = {
  scheduled: { state: "scheduled", label: "scheduled" },
  inProgress: { state: "inProgress", label: "in progress" },
  finished: { state: "finished", label: "finished" },
  aborted: { state: "aborted", label: "aborted" },
};

const TIMELINE_LABEL: Record<ExamTimelineEventType, string> = {
  examCreated: "Exam created",
  examStarted: "Exam started",
  examFinished: "Exam finished",
  examAborted: "Exam aborted",
  violationRecorded: "Violation recorded",
  mediaSegmentAttached: "Media segment attached",
  reportGenerated: "Report generated",
};

const TIMELINE_DOT: Record<
  ExamTimelineEventType,
  ConsoleExamTimelineEntry["dot"]
> = {
  examCreated: "standby",
  examStarted: "online",
  examFinished: "online",
  examAborted: "offline",
  violationRecorded: "degraded",
  mediaSegmentAttached: "online",
  reportGenerated: "online",
};

export function formatExamDuration(dto: ExamDto): string {
  if (!dto.startedAt) return "—";
  const start = Date.parse(dto.startedAt);
  if (Number.isNaN(start)) return "—";
  const endIso = dto.finishedAt;
  const end = endIso ? Date.parse(endIso) : NaN;
  if (Number.isNaN(end)) return "—";
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

export function formatExamScore(dto: ExamDto): string {
  if (typeof dto.score === "number") return String(dto.score);
  if (dto.outcome === "passed") return "passed";
  if (dto.outcome === "failed") return "failed";
  return "—";
}

export function mapTimelineEventToConsole(
  event: ExamTimelineEventDto,
): ConsoleExamTimelineEntry {
  const label = TIMELINE_LABEL[event.eventType] ?? event.eventType;
  const dot = TIMELINE_DOT[event.eventType] ?? "standby";
  return {
    id: event.eventId,
    label,
    detail:
      event.actor?.actorId !== undefined
        ? `actor ${event.actor.actorId}`
        : "—",
    time: event.eventTime,
    dot,
  };
}

export function mapExamDtoToConsole(
  dto: ExamDto,
  timeline: readonly ExamTimelineEventDto[] = [],
): ConsoleExam {
  const stateMapped = STATE_FOR_STATUS[dto.status] ?? {
    state: "scheduled" as const,
    label: dto.status,
  };
  return {
    id: dto.examId,
    candidate: dto.candidateRef.candidateId,
    vehicle: dto.vehicleRef.vehicleId,
    route: "—",
    state: stateMapped.state,
    stateLabel: stateMapped.label,
    score: formatExamScore(dto),
    started: dto.startedAt ?? dto.scheduledAt,
    duration: formatExamDuration(dto),
    timeline: timeline.map(mapTimelineEventToConsole),
  };
}

/**
 * Live list loader. Exam-service does not currently expose
 * `GET /exams` — the canonical contract has only POST /exams +
 * detail/lifecycle/timeline reads. Until backend ships a list
 * endpoint, returns an empty snapshot so the workspace's EmptyState
 * renders cleanly in live mode. Tech-debt entry in the report.
 */
export async function liveExamsLoader(
  _adapter: AutodromeApi,
): Promise<ConsoleExamsSnapshot> {
  return {
    totals: { inProgress: 0, scheduledToday: 0 },
    exams: [],
  };
}

/** GET /exams/{examId} — single exam read (no inline timeline). */
export async function liveExamGet(
  adapter: AutodromeApi,
  examId: string,
): Promise<ConsoleExam> {
  const result = await adapter.exam.GET("/exams/{examId}", {
    params: { path: { examId } },
  });
  const dto = result.data as ExamDto | undefined;
  if (!dto) {
    throw new Error("exam-service returned an empty body");
  }
  return mapExamDtoToConsole(dto);
}

/**
 * POST /exams — create an exam. A fresh `Idempotency-Key` header
 * is generated per call so retries don't create duplicates.
 */
export async function liveExamCreate(
  adapter: AutodromeApi,
  creation: ExamCreationDto,
): Promise<ConsoleExam> {
  const result = await adapter.exam.POST("/exams", {
    params: {
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: creation,
  });
  const dto = result.data as ExamDto | undefined;
  if (!dto) {
    throw new Error(
      "exam-service returned an empty body for POST /exams",
    );
  }
  return mapExamDtoToConsole(dto);
}

/** POST /exams/{examId}/start — lifecycle transition to in-progress. */
export async function liveExamStart(
  adapter: AutodromeApi,
  examId: string,
  start: ExamStartDto = {},
): Promise<ConsoleExam> {
  const result = await adapter.exam.POST("/exams/{examId}/start", {
    params: {
      path: { examId },
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: start,
  });
  const dto = result.data as ExamDto | undefined;
  if (!dto) {
    throw new Error(
      "exam-service returned an empty body for start",
    );
  }
  return mapExamDtoToConsole(dto);
}

/** POST /exams/{examId}/finish — outcome + optional score. */
export async function liveExamFinish(
  adapter: AutodromeApi,
  examId: string,
  finish: ExamFinishDto,
): Promise<ConsoleExam> {
  const result = await adapter.exam.POST("/exams/{examId}/finish", {
    params: {
      path: { examId },
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: finish,
  });
  const dto = result.data as ExamDto | undefined;
  if (!dto) {
    throw new Error(
      "exam-service returned an empty body for finish",
    );
  }
  return mapExamDtoToConsole(dto);
}

/** POST /exams/{examId}/abort — operator/system abort with reason. */
export async function liveExamAbort(
  adapter: AutodromeApi,
  examId: string,
  abort: ExamAbortDto,
): Promise<ConsoleExam> {
  const result = await adapter.exam.POST("/exams/{examId}/abort", {
    params: {
      path: { examId },
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: abort,
  });
  const dto = result.data as ExamDto | undefined;
  if (!dto) {
    throw new Error(
      "exam-service returned an empty body for abort",
    );
  }
  return mapExamDtoToConsole(dto);
}

export type LiveExamTimelineQuery = {
  pageSize?: number;
  pageToken?: string;
  sortOrder?: "asc" | "desc";
};

export type LiveExamTimelineResult = {
  entries: ConsoleExamTimelineEntry[];
  nextPageToken?: string;
};

/**
 * GET /exams/{examId}/timeline — paginated timeline read.
 *
 * Timeline events are mapped through `mapTimelineEventToConsole`.
 * On `ApiError` (e.g. service degraded) the caller surfaces the
 * degraded state via the existing `<ApiErrorView>` primitive — no
 * silent fallback to an empty timeline here, since "empty" and
 * "unavailable" are operator-distinct states.
 */
export async function liveExamTimeline(
  adapter: AutodromeApi,
  examId: string,
  query: LiveExamTimelineQuery = {},
): Promise<LiveExamTimelineResult> {
  const result = await adapter.exam.GET("/exams/{examId}/timeline", {
    params: {
      path: { examId },
      query: {
        ...(query.pageSize !== undefined
          ? { pageSize: query.pageSize }
          : {}),
        ...(query.pageToken !== undefined
          ? { pageToken: query.pageToken }
          : {}),
        ...(query.sortOrder !== undefined
          ? { sortOrder: query.sortOrder }
          : {}),
      },
    },
  });
  const page = result.data as ExamTimelinePageDto | undefined;
  if (!page) {
    throw new Error(
      "exam-service returned an empty body for timeline",
    );
  }
  return {
    entries: (page.items ?? []).map(mapTimelineEventToConsole),
    nextPageToken: page.nextPageToken,
  };
}
