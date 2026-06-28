import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import {
  liveExamMediaIndex,
  mapExamMediaIndexDto,
  mapExamMediaRecordingDto,
  mapMediaRecordingStatusToConsole,
} from "@/app/(shell)/evidence/_components/liveEvidenceDetailLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapMediaRecordingStatusToConsole", () => {
  it("preserves known statuses and falls back to 'unknown'", () => {
    expect(mapMediaRecordingStatusToConsole("active")).toBe("active");
    expect(mapMediaRecordingStatusToConsole("finalized")).toBe("finalized");
    expect(mapMediaRecordingStatusToConsole("failed")).toBe("failed");
    expect(
      mapMediaRecordingStatusToConsole(
        "weird" as unknown as "active",
      ),
    ).toBe("unknown");
  });
});

describe("mapExamMediaRecordingDto", () => {
  it("maps a DTO recording to console shape with labels", () => {
    const rec = mapExamMediaRecordingDto({
      recordingId: "REC-1",
      sessionId: "SES-1",
      evidenceType: "videoCabin",
      status: "finalized",
      startedAt: "2026-06-28T09:00:00Z",
      finalizedAt: "2026-06-28T09:30:00Z",
      segmentCount: 4,
    });
    expect(rec.statusLabel).toBe("Finalized");
    expect(rec.segmentCount).toBe(4);
    expect(rec.sessionId).toBe("SES-1");
    expect(rec.evidenceType).toBe("videoCabin");
  });
});

describe("mapExamMediaIndexDto", () => {
  it("maps the page DTO and falls back to provided examId", () => {
    const idx = mapExamMediaIndexDto("EXM-1", {
      examId: "00000000-0000-0000-0000-000000000001",
      recordings: [
        {
          recordingId: "REC-1",
          status: "finalized",
          startedAt: "2026-06-28T09:00:00Z",
          segmentCount: 2,
        },
      ],
    });
    expect(idx.examId).toBe("00000000-0000-0000-0000-000000000001");
    expect(idx.recordings).toHaveLength(1);
    expect(idx.recordings[0].statusLabel).toBe("Finalized");
  });
});

describe("liveExamMediaIndex", () => {
  it("returns a snapshot with mapped recordings on success", async () => {
    const GET = vi.fn(async () => ({
      data: {
        examId: "00000000-0000-0000-0000-000000000001",
        recordings: [
          {
            recordingId: "REC-1",
            status: "active",
            startedAt: "2026-06-28T09:00:00Z",
            segmentCount: 0,
          },
          {
            recordingId: "REC-2",
            sessionId: "SES-1",
            evidenceType: "videoCabin",
            status: "finalized",
            startedAt: "2026-06-28T09:05:00Z",
            finalizedAt: "2026-06-28T09:35:00Z",
            segmentCount: 3,
          },
        ],
      },
    }));
    const api = makeApi({
      mediaArchive: { GET } as unknown as AutodromeApi["mediaArchive"],
    });
    const idx = await liveExamMediaIndex(api, "EXM-1");
    expect(GET).toHaveBeenCalledWith(
      "/media/exams/{examId}/media",
      { params: { path: { examId: "EXM-1" } } },
    );
    expect(idx.recordings).toHaveLength(2);
    expect(idx.recordings[1].statusLabel).toBe("Finalized");
    expect(idx.indexError).toBeUndefined();
  });

  it("captures error as indexError without throwing (degraded panel)", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 503,
        url: "/media/exams/EXM-1/media",
        code: "MEDIA_INDEX_DOWN",
        message: "media-archive degraded",
      });
    });
    const api = makeApi({
      mediaArchive: { GET } as unknown as AutodromeApi["mediaArchive"],
    });
    const idx = await liveExamMediaIndex(api, "EXM-1");
    expect(idx.recordings).toHaveLength(0);
    expect(idx.indexError).toMatch(/degraded/i);
  });

  it("returns indexError when backend responds with empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      mediaArchive: { GET } as unknown as AutodromeApi["mediaArchive"],
    });
    const idx = await liveExamMediaIndex(api, "EXM-1");
    expect(idx.indexError).toMatch(/no body/i);
  });
});
