import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import {
  liveExamProtocolRequest,
  mapExamProtocolResultDtoToConsole,
} from "@/app/(shell)/reporting/_components/liveReportingLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

const SAMPLE_DTO = {
  reportId: "00000000-0000-0000-0000-000000000010",
  examId: "00000000-0000-0000-0000-000000000001",
  status: "ready" as const,
  degraded: false,
  missingEvidence: [],
  snapshotHash: "sha256:abc",
  violationCount: 3,
  mediaCount: 4,
  audioCount: 1,
  biometryCount: 2,
  generatedAt: "2026-06-28T09:40:00Z",
};

describe("mapExamProtocolResultDtoToConsole", () => {
  it("maps the DTO to console shape with status label", () => {
    const r = mapExamProtocolResultDtoToConsole(SAMPLE_DTO);
    expect(r.statusLabel).toMatch(/ready/i);
    expect(r.snapshotHash).toBe("sha256:abc");
    expect(r.missingEvidence).toHaveLength(0);
    expect(r.degraded).toBe(false);
  });
  it("preserves degraded=true and missingEvidence list", () => {
    const r = mapExamProtocolResultDtoToConsole({
      ...SAMPLE_DTO,
      degraded: true,
      missingEvidence: ["violation-rule:VR-1", "media:MED-2"],
      status: "failed",
    });
    expect(r.degraded).toBe(true);
    expect(r.missingEvidence).toEqual([
      "violation-rule:VR-1",
      "media:MED-2",
    ]);
    expect(r.statusLabel).toMatch(/failed/i);
  });
});

describe("liveExamProtocolRequest", () => {
  it("POSTs /reports/exams/{examId}/protocol with Idempotency-Key + body", async () => {
    const POST = vi.fn(async () => ({ data: SAMPLE_DTO }));
    const api = makeApi({
      reportingDocument: {
        POST,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const result = await liveExamProtocolRequest(api, "EXM-1", {
      format: "pdf",
    });
    expect(POST).toHaveBeenCalledTimes(1);
    const call = POST.mock.calls[0] as unknown as [string, unknown];
    expect(call[0]).toBe("/reports/exams/{examId}/protocol");
    const opts = call[1] as {
      params: {
        path: { examId: string };
        header: { "Idempotency-Key": string };
      };
      body: { format: string };
    };
    expect(opts.params.path.examId).toBe("EXM-1");
    expect(opts.params.header["Idempotency-Key"]).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(opts.body.format).toBe("pdf");
    expect(result.reportId).toBe(SAMPLE_DTO.reportId);
  });

  it("rejects with ApiError when backend responds 422", async () => {
    const POST = vi.fn(async () => {
      throw new ApiError({
        status: 422,
        url: "/reports/exams/EXM-1/protocol",
        code: "PROTOCOL_VALIDATION_FAILED",
        message: "missing evidence reference",
      });
    });
    const api = makeApi({
      reportingDocument: {
        POST,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    await expect(
      liveExamProtocolRequest(api, "EXM-1", { format: "pdf" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("throws when the backend returns an empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      reportingDocument: {
        POST,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    await expect(
      liveExamProtocolRequest(api, "EXM-1", { format: "pdf" }),
    ).rejects.toThrow(/empty body/);
  });
});
