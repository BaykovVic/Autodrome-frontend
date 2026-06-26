import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import {
  applyManifestToMediaRef,
  applyReportToReportRef,
  liveEvidenceDetailLoader,
  mapReportStatusDtoToConsole,
} from "@/app/(shell)/evidence/_components/liveEvidenceDetailLoader";

function makeApi(
  partial: Partial<AutodromeApi>,
): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapReportStatusDtoToConsole", () => {
  it("maps backend statuses to console statuses", () => {
    expect(mapReportStatusDtoToConsole("accepted")).toBe("generating");
    expect(mapReportStatusDtoToConsole("inProgress")).toBe("generating");
    expect(mapReportStatusDtoToConsole("ready")).toBe("ready");
    expect(mapReportStatusDtoToConsole("failed")).toBe("failed");
  });
});

describe("applyManifestToMediaRef", () => {
  it("overrides segmentCount + manifestExpiresAt from manifest", () => {
    const base = {
      recordingId: "REC-1",
      status: "active" as const,
      statusLabel: "Active",
      sources: ["cabinFront"] as const,
      segmentCount: 0,
      manifestExpiresAt: "—",
    };
    const result = applyManifestToMediaRef(
      { ...base, sources: [...base.sources] },
      {
        recordingId: "REC-1",
        segments: [
          {
            sourceId: "cabinFront",
            segments: [
              {
                segmentId: "s1",
                recordingId: "REC-1",
                sourceId: "cabinFront",
                startedAt: "2026-06-25T10:00:00Z",
                endedAt: "2026-06-25T10:01:00Z",
                objectKey: "obj-1",
                checksum: "hash-1",
              },
              {
                segmentId: "s2",
                recordingId: "REC-1",
                sourceId: "cabinFront",
                startedAt: "2026-06-25T10:01:00Z",
                endedAt: "2026-06-25T10:02:00Z",
                objectKey: "obj-2",
                checksum: "hash-2",
              },
            ],
          },
        ],
        timelineMap: [],
        expiresAt: "2026-06-26T18:00:00Z",
      },
    );
    expect(result.segmentCount).toBe(2);
    expect(result.manifestExpiresAt).toBe("2026-06-26T18:00:00Z");
    expect(result.status).toBe("finalized");
    expect(result.manifestError).toBeUndefined();
  });
});

describe("applyReportToReportRef", () => {
  it("overrides status + generatedAt from report DTO", () => {
    const result = applyReportToReportRef(
      {
        reportId: "RPT-1",
        status: "generating",
        statusLabel: "Generating",
        generatedAt: "—",
      },
      {
        reportId: "RPT-1",
        reportType: "examProtocol",
        status: "ready",
        requestedAt: "2026-06-19T12:00:00Z",
        generatedAt: "2026-06-19T12:18:42Z",
      },
    );
    expect(result.status).toBe("ready");
    expect(result.generatedAt).toBe("2026-06-19T12:18:42Z");
    expect(result.reportError).toBeUndefined();
  });
});

describe("liveEvidenceDetailLoader: integration", () => {
  it("enriches mediaRefs + reportRefs from backend responses", async () => {
    const mediaGET = vi.fn(async () => ({
      data: {
        recordingId: "REC-77210-A",
        segments: [
          {
            sourceId: "cabinFront",
            segments: [
              {
                segmentId: "s1",
                recordingId: "REC-77210-A",
                sourceId: "cabinFront",
                startedAt: "2026-06-25T10:00:00Z",
                endedAt: "2026-06-25T10:01:00Z",
                objectKey: "obj-1",
                checksum: "hash-1",
              },
            ],
          },
        ],
        timelineMap: [],
        expiresAt: "2026-06-27T18:00:00Z",
      },
    }));
    const reportGET = vi.fn(async () => ({
      data: {
        reportId: "RPT-EXM-2026-0337",
        reportType: "examProtocol",
        status: "ready",
        requestedAt: "2026-06-19T12:00:00Z",
        generatedAt: "2026-06-19T12:18:42Z",
      },
    }));
    const api = makeApi({
      mediaArchive: {
        GET: mediaGET,
      } as unknown as AutodromeApi["mediaArchive"],
      reportingDocument: {
        GET: reportGET,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const detail = await liveEvidenceDetailLoader(api, "EVD-77210");
    expect(detail.mediaRefs[0]!.segmentCount).toBe(1);
    expect(detail.mediaRefs[0]!.manifestExpiresAt).toBe(
      "2026-06-27T18:00:00Z",
    );
    expect(detail.reportRefs[0]!.status).toBe("ready");
    expect(detail.reportRefs[0]!.generatedAt).toBe(
      "2026-06-19T12:18:42Z",
    );
    expect(mediaGET).toHaveBeenCalledWith(
      "/media/recordings/{recordingId}/manifest",
      { params: { path: { recordingId: "REC-77210-A" } } },
    );
    expect(reportGET).toHaveBeenCalledWith("/reports/{reportId}", {
      params: { path: { reportId: "RPT-EXM-2026-0337" } },
    });
  });

  it("captures manifest fetch errors per-ref without dropping other refs", async () => {
    const mediaGET = vi.fn(async () => {
      throw new ApiError({
        status: 409,
        url: "/media/recordings/REC-77211-EXT/manifest",
        code: "MEDIA_RECORDING_NOT_FINALIZED",
        message: "Recording is still active.",
      });
    });
    const reportGET = vi.fn(async () => ({
      data: {
        reportId: "RPT-EXM-2026-0337",
        reportType: "examProtocol",
        status: "ready",
        requestedAt: "2026-06-19T12:00:00Z",
        generatedAt: "2026-06-19T12:18:42Z",
      },
    }));
    const api = makeApi({
      mediaArchive: {
        GET: mediaGET,
      } as unknown as AutodromeApi["mediaArchive"],
      reportingDocument: {
        GET: reportGET,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const detail = await liveEvidenceDetailLoader(api, "EVD-77211");
    expect(detail.mediaRefs).toHaveLength(2);
    expect(detail.mediaRefs[0]!.manifestError).toMatch(
      /still active/i,
    );
    expect(detail.mediaRefs[1]!.manifestError).toMatch(
      /still active/i,
    );
    // Report ref enrichment still works.
    expect(detail.reportRefs[0]!.status).toBe("ready");
  });

  it("captures report fetch errors per-ref", async () => {
    const mediaGET = vi.fn(async () => ({
      data: {
        recordingId: "REC-77205-AUDIO",
        segments: [],
        timelineMap: [],
        expiresAt: "2026-06-27T18:00:00Z",
      },
    }));
    const reportGET = vi.fn(async () => {
      throw new ApiError({
        status: 503,
        url: "/reports/RPT-EXM-2026-0334",
        code: "REPORTING_SERVICE_DEGRADED",
        message: "Reporting service is degraded.",
      });
    });
    const api = makeApi({
      mediaArchive: {
        GET: mediaGET,
      } as unknown as AutodromeApi["mediaArchive"],
      reportingDocument: {
        GET: reportGET,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const detail = await liveEvidenceDetailLoader(api, "EVD-77205");
    expect(detail.reportRefs[0]!.reportError).toMatch(
      /reporting service is degraded/i,
    );
    expect(detail.mediaRefs[0]!.manifestError).toBeUndefined();
  });

  it("returns base record even when both endpoints fail (graceful degradation)", async () => {
    const mediaGET = vi.fn(async () => {
      throw new Error("network");
    });
    const reportGET = vi.fn(async () => {
      throw new Error("network");
    });
    const api = makeApi({
      mediaArchive: {
        GET: mediaGET,
      } as unknown as AutodromeApi["mediaArchive"],
      reportingDocument: {
        GET: reportGET,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const detail = await liveEvidenceDetailLoader(api, "EVD-77210");
    expect(detail.evidence.id).toBe("EVD-77210");
    expect(detail.mediaRefs[0]!.manifestError).toBe("network");
    expect(detail.reportRefs[0]!.reportError).toBe("network");
  });
});
