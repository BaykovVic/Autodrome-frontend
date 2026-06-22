import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import {
  formatExamDuration,
  formatExamScore,
  liveExamAbort,
  liveExamCreate,
  liveExamFinish,
  liveExamGet,
  liveExamStart,
  liveExamTimeline,
  liveExamsLoader,
  mapExamDtoToConsole,
  mapTimelineEventToConsole,
} from "@/app/(shell)/exams/_components/liveExamLoader";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/exam";

type ExamDto = components["schemas"]["Exam"];
type ExamTimelineEventDto = components["schemas"]["ExamTimelineEvent"];

function makeDto(over: Partial<ExamDto> = {}): ExamDto {
  return {
    examId: "00000000-0000-0000-0000-0000000000ee",
    candidateRef: { candidateId: "cand-1" },
    vehicleRef: { vehicleId: "veh-1" },
    examType: "autodromeBasic",
    status: "scheduled",
    scheduledAt: "2026-06-22T10:00:00Z",
    createdAt: "2026-06-22T09:00:00Z",
    ...over,
  };
}

function makeEvent(
  over: Partial<ExamTimelineEventDto> = {},
): ExamTimelineEventDto {
  return {
    eventId: "ev-1",
    eventType: "examCreated",
    eventTime: "2026-06-22T09:00:00Z",
    ...over,
  };
}

function makeExamApi(
  exam: Partial<AutodromeApi["exam"]>,
): AutodromeApi {
  return { exam } as unknown as AutodromeApi;
}

describe("liveExamLoader: mappers (pure)", () => {
  it("maps a scheduled exam to console view-model with safe defaults", () => {
    const v = mapExamDtoToConsole(makeDto());
    expect(v.id).toBe("00000000-0000-0000-0000-0000000000ee");
    expect(v.candidate).toBe("cand-1");
    expect(v.vehicle).toBe("veh-1");
    expect(v.state).toBe("scheduled");
    expect(v.stateLabel).toBe("scheduled");
    expect(v.score).toBe("—");
    expect(v.duration).toBe("—");
    expect(v.route).toBe("—");
    expect(v.timeline).toEqual([]);
  });

  it("maps in-progress status to inProgress + 'in progress' label", () => {
    const v = mapExamDtoToConsole(
      makeDto({ status: "inProgress", startedAt: "2026-06-22T10:05:00Z" }),
    );
    expect(v.state).toBe("inProgress");
    expect(v.stateLabel).toBe("in progress");
    expect(v.started).toBe("2026-06-22T10:05:00Z");
  });

  it("maps finished exam with numeric score", () => {
    const v = mapExamDtoToConsole(
      makeDto({
        status: "finished",
        startedAt: "2026-06-22T10:05:00Z",
        finishedAt: "2026-06-22T10:35:30Z",
        outcome: "passed",
        score: 92,
      }),
    );
    expect(v.state).toBe("finished");
    expect(v.score).toBe("92");
    expect(v.duration).toBe("30:30");
  });

  it("maps finished exam with outcome but no score to outcome label", () => {
    expect(formatExamScore(makeDto({ outcome: "passed" }))).toBe("passed");
    expect(formatExamScore(makeDto({ outcome: "failed" }))).toBe("failed");
    expect(formatExamScore(makeDto())).toBe("—");
  });

  it("maps aborted status correctly", () => {
    const v = mapExamDtoToConsole(makeDto({ status: "aborted" }));
    expect(v.state).toBe("aborted");
    expect(v.stateLabel).toBe("aborted");
  });

  it("formats duration from start/finish timestamps", () => {
    expect(
      formatExamDuration(
        makeDto({
          startedAt: "2026-06-22T10:00:00Z",
          finishedAt: "2026-06-22T10:01:45Z",
        }),
      ),
    ).toBe("1:45");
    expect(
      formatExamDuration(
        makeDto({ startedAt: "2026-06-22T10:00:00Z" }),
      ),
    ).toBe("—");
    expect(formatExamDuration(makeDto())).toBe("—");
  });

  it("maps timeline event with known type to label + dot", () => {
    const e = mapTimelineEventToConsole(
      makeEvent({ eventType: "examStarted" }),
    );
    expect(e.label).toBe("Exam started");
    expect(e.dot).toBe("online");

    expect(
      mapTimelineEventToConsole(
        makeEvent({ eventType: "violationRecorded" }),
      ).dot,
    ).toBe("degraded");

    expect(
      mapTimelineEventToConsole(
        makeEvent({ eventType: "examAborted" }),
      ).dot,
    ).toBe("offline");
  });

  it("maps timeline event actor to detail text or fallback", () => {
    expect(
      mapTimelineEventToConsole(
        makeEvent({ actor: { actorId: "actor-7", actorType: "user" } }),
      ).detail,
    ).toBe("actor actor-7");
    expect(mapTimelineEventToConsole(makeEvent()).detail).toBe("—");
  });

  it("threads timeline events into ConsoleExam when supplied", () => {
    const v = mapExamDtoToConsole(makeDto(), [
      makeEvent({ eventId: "ev-1", eventType: "examCreated" }),
      makeEvent({ eventId: "ev-2", eventType: "examStarted" }),
    ]);
    expect(v.timeline.map((t) => t.id)).toEqual(["ev-1", "ev-2"]);
  });
});

describe("liveExamsLoader (list): returns empty snapshot in absence of GET /exams", () => {
  it("returns empty list + zero totals (backend gap documented)", async () => {
    const api = makeExamApi({});
    const snapshot = await liveExamsLoader(api);
    expect(snapshot.totals).toEqual({ inProgress: 0, scheduledToday: 0 });
    expect(snapshot.exams).toEqual([]);
  });
});

describe("liveExamGet / liveExamCreate / liveExamStart / liveExamFinish / liveExamAbort", () => {
  it("GET /exams/{id}: passes path param and maps DTO", async () => {
    const dto = makeDto({ examId: "e-X", status: "inProgress" });
    const GET = vi.fn(async () => ({ data: dto }));
    const api = makeExamApi({
      GET: GET as unknown as AutodromeApi["exam"]["GET"],
    });

    const v = await liveExamGet(api, "e-X");

    expect(GET).toHaveBeenCalledWith("/exams/{examId}", {
      params: { path: { examId: "e-X" } },
    });
    expect(v.id).toBe("e-X");
    expect(v.state).toBe("inProgress");
  });

  it("GET /exams/{id}: throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeExamApi({
      GET: GET as unknown as AutodromeApi["exam"]["GET"],
    });
    await expect(liveExamGet(api, "e-Z")).rejects.toThrow(/empty body/i);
  });

  it("POST /exams: attaches Idempotency-Key + forwards body", async () => {
    const created = makeDto({ examId: "e-NEW" });
    const POST = vi.fn(async () => ({ data: created }));
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });

    const body: components["schemas"]["ExamCreation"] = {
      candidateRef: { candidateId: "cand-1" },
      vehicleRef: { vehicleId: "veh-1" },
      examType: "autodromeBasic",
      scheduledAt: "2026-06-22T10:00:00Z",
    };
    const v = await liveExamCreate(api, body);

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: { header: { "Idempotency-Key": string } };
        body: components["schemas"]["ExamCreation"];
      },
    ];
    expect(path).toBe("/exams");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(body);
    expect(v.id).toBe("e-NEW");
  });

  it("POST /exams: each call uses a fresh Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({ data: makeDto() }));
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });
    const body: components["schemas"]["ExamCreation"] = {
      candidateRef: { candidateId: "cand-1" },
      vehicleRef: { vehicleId: "veh-1" },
      examType: "autodromeBasic",
      scheduledAt: "2026-06-22T10:00:00Z",
    };
    await liveExamCreate(api, body);
    await liveExamCreate(api, body);
    const [, opts1] = POST.mock.calls[0] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    const [, opts2] = POST.mock.calls[1] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    expect(opts1.params.header["Idempotency-Key"]).not.toBe(
      opts2.params.header["Idempotency-Key"],
    );
  });

  it("POST /exams: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });
    await expect(
      liveExamCreate(api, {
        candidateRef: { candidateId: "c" },
        vehicleRef: { vehicleId: "v" },
        examType: "autodromeBasic",
        scheduledAt: "2026-06-22T10:00:00Z",
      }),
    ).rejects.toThrow(/empty body/i);
  });

  it("POST /exams: propagates ApiError from middleware", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 409,
        code: "CONFLICT",
        message: "duplicate exam",
        url: "/api/exam/v1/exams",
      });
    });
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });
    await expect(
      liveExamCreate(api, {
        candidateRef: { candidateId: "c" },
        vehicleRef: { vehicleId: "v" },
        examType: "autodromeBasic",
        scheduledAt: "2026-06-22T10:00:00Z",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("POST /exams/{id}/start: defaults body to empty object + maps to inProgress", async () => {
    const dto = makeDto({
      examId: "e-S",
      status: "inProgress",
      startedAt: "2026-06-22T11:00:00Z",
    });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });

    const v = await liveExamStart(api, "e-S");

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { examId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["ExamStart"];
      },
    ];
    expect(path).toBe("/exams/{examId}/start");
    expect(opts.params.path.examId).toBe("e-S");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual({});
    expect(v.state).toBe("inProgress");
  });

  it("POST /exams/{id}/finish: forwards outcome + score body", async () => {
    const dto = makeDto({
      examId: "e-F",
      status: "finished",
      outcome: "passed",
      score: 88,
      startedAt: "2026-06-22T10:00:00Z",
      finishedAt: "2026-06-22T10:30:00Z",
    });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });

    const v = await liveExamFinish(api, "e-F", {
      outcome: "passed",
      score: 88,
    });

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { examId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["ExamFinish"];
      },
    ];
    expect(path).toBe("/exams/{examId}/finish");
    expect(opts.params.path.examId).toBe("e-F");
    expect(opts.body.outcome).toBe("passed");
    expect(opts.body.score).toBe(88);
    expect(v.score).toBe("88");
    expect(v.duration).toBe("30:00");
  });

  it("POST /exams/{id}/abort: forwards reason body", async () => {
    const dto = makeDto({ examId: "e-A", status: "aborted" });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });

    const v = await liveExamAbort(api, "e-A", {
      reason: "vehicle malfunction",
    });

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { examId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["ExamAbort"];
      },
    ];
    expect(path).toBe("/exams/{examId}/abort");
    expect(opts.params.path.examId).toBe("e-A");
    expect(opts.body.reason).toBe("vehicle malfunction");
    expect(v.state).toBe("aborted");
  });

  it("POST /exams/{id}/start: throws on empty body response", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });
    await expect(liveExamStart(api, "e-X")).rejects.toThrow(
      /empty body/i,
    );
  });

  it("POST /exams/{id}/abort: propagates ApiError from middleware", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 422,
        code: "INVALID_TRANSITION",
        message: "cannot abort finished exam",
        url: "/api/exam/v1/exams/e-A/abort",
      });
    });
    const api = makeExamApi({
      POST: POST as unknown as AutodromeApi["exam"]["POST"],
    });
    await expect(
      liveExamAbort(api, "e-A", { reason: "x" }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("liveExamTimeline", () => {
  it("GET /exams/{id}/timeline: passes path + query + maps events", async () => {
    const page: components["schemas"]["ExamTimelinePage"] = {
      items: [
        makeEvent({ eventId: "ev-1", eventType: "examCreated" }),
        makeEvent({ eventId: "ev-2", eventType: "examStarted" }),
      ],
      nextPageToken: "tok-2",
    };
    const GET = vi.fn(async () => ({ data: page }));
    const api = makeExamApi({
      GET: GET as unknown as AutodromeApi["exam"]["GET"],
    });

    const result = await liveExamTimeline(api, "e-T", {
      pageSize: 50,
      sortOrder: "desc",
    });

    expect(GET).toHaveBeenCalledTimes(1);
    const [path, opts] = GET.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { examId: string };
          query: {
            pageSize?: number;
            pageToken?: string;
            sortOrder?: "asc" | "desc";
          };
        };
      },
    ];
    expect(path).toBe("/exams/{examId}/timeline");
    expect(opts.params.path.examId).toBe("e-T");
    expect(opts.params.query.pageSize).toBe(50);
    expect(opts.params.query.sortOrder).toBe("desc");
    expect(opts.params.query.pageToken).toBeUndefined();
    expect(result.entries.map((e) => e.id)).toEqual(["ev-1", "ev-2"]);
    expect(result.nextPageToken).toBe("tok-2");
  });

  it("GET /exams/{id}/timeline: omits empty query params", async () => {
    const GET = vi.fn(async () => ({ data: { items: [] } }));
    const api = makeExamApi({
      GET: GET as unknown as AutodromeApi["exam"]["GET"],
    });
    await liveExamTimeline(api, "e-T");
    const [, opts] = GET.mock.calls[0] as unknown as [
      string,
      { params: { query: Record<string, unknown> } },
    ];
    expect(opts.params.query).toEqual({});
  });

  it("GET /exams/{id}/timeline: throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeExamApi({
      GET: GET as unknown as AutodromeApi["exam"]["GET"],
    });
    await expect(liveExamTimeline(api, "e-T")).rejects.toThrow(
      /empty body/i,
    );
  });

  it("GET /exams/{id}/timeline: propagates ApiError (degraded)", async () => {
    const GET = vi.fn(() => {
      throw new ApiError({
        status: 503,
        code: "SERVICE_DEGRADED",
        message: "timeline service degraded",
        url: "/api/exam/v1/exams/e-T/timeline",
      });
    });
    const api = makeExamApi({
      GET: GET as unknown as AutodromeApi["exam"]["GET"],
    });
    await expect(liveExamTimeline(api, "e-T")).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
