import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import {
  liveReportingLoader,
  mapReportDtoToConsole,
  mapReportStatusDtoToConsoleReporting,
  mapTemplateDtoToConsole,
} from "@/app/(shell)/reporting/_components/liveReportingLoader";

function makeApi(
  partial: Partial<AutodromeApi>,
): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapReportStatusDtoToConsoleReporting", () => {
  it("passes through canonical statuses", () => {
    expect(mapReportStatusDtoToConsoleReporting("accepted")).toBe(
      "accepted",
    );
    expect(mapReportStatusDtoToConsoleReporting("inProgress")).toBe(
      "inProgress",
    );
    expect(mapReportStatusDtoToConsoleReporting("ready")).toBe("ready");
    expect(mapReportStatusDtoToConsoleReporting("failed")).toBe("failed");
  });
});

describe("mapTemplateDtoToConsole", () => {
  it("maps canonical Template DTO to view-model template", () => {
    const t = mapTemplateDtoToConsole({
      templateId: "TPL-1",
      name: "Exam protocol · default",
      reportType: "examProtocol",
      status: "published",
      version: 7,
      publishedAt: "2026-06-10T09:00:00Z",
      createdAt: "2026-06-01T08:00:00Z",
    });
    expect(t.templateId).toBe("TPL-1");
    expect(t.reportType).toBe("examProtocol");
    expect(t.reportTypeLabel).toBe("Exam protocol");
    expect(t.publishedAt).toBe("2026-06-10T09:00:00Z");
  });

  it("falls back publishedAt to '—' when not set", () => {
    const t = mapTemplateDtoToConsole({
      templateId: "TPL-2",
      name: "Draft template",
      reportType: "violationJournal",
      status: "draft",
      version: 1,
      createdAt: "2026-06-01T08:00:00Z",
    });
    expect(t.publishedAt).toBe("—");
  });
});

describe("mapReportDtoToConsole", () => {
  it("maps canonical Report DTO to view-model report", () => {
    const r = mapReportDtoToConsole({
      reportId: "RPT-1",
      reportType: "examProtocol",
      status: "ready",
      format: "pdf",
      examRef: { examId: "EXM-1" },
      requestedAt: "2026-06-19T12:00:00Z",
      generatedAt: "2026-06-19T12:18:42Z",
    });
    expect(r.examId).toBe("EXM-1");
    expect(r.status).toBe("ready");
    expect(r.formatLabel).toBe("PDF");
    expect(r.generatedAt).toBe("2026-06-19T12:18:42Z");
  });

  it("falls back examId + generatedAt to '—' when missing", () => {
    const r = mapReportDtoToConsole({
      reportId: "RPT-2",
      reportType: "examProtocol",
      status: "inProgress",
      format: "pdf",
      requestedAt: "2026-06-19T15:21:00Z",
    });
    expect(r.examId).toBe("—");
    expect(r.generatedAt).toBe("—");
  });
});

describe("liveReportingLoader: integration", () => {
  it("returns templates + reports + totals on happy path", async () => {
    const GET = vi.fn(async (path: string) => {
      if (path === "/reports/templates") {
        return {
          data: {
            items: [
              {
                templateId: "TPL-1",
                name: "Exam protocol · default",
                reportType: "examProtocol",
                status: "published",
                version: 7,
                publishedAt: "2026-06-10T09:00:00Z",
                createdAt: "2026-06-01T08:00:00Z",
              },
            ],
          },
        };
      }
      // /reports/{reportId}
      return {
        data: {
          reportId: "RPT-EXM-2026-0337",
          reportType: "examProtocol",
          status: "ready",
          format: "pdf",
          examRef: { examId: "EXM-2026-0337" },
          requestedAt: "2026-06-19T12:00:00Z",
          generatedAt: "2026-06-19T12:18:42Z",
        },
      };
    });
    const api = makeApi({
      reportingDocument: {
        GET,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const snap = await liveReportingLoader(api, ["RPT-EXM-2026-0337"]);
    expect(snap.totals.templates).toBe(1);
    expect(snap.totals.publishedTemplates).toBe(1);
    expect(snap.totals.reports).toBe(1);
    expect(snap.totals.readyReports).toBe(1);
    expect(snap.reports[0]!.fetchError).toBeUndefined();
    expect(snap.reports[0]!.status).toBe("ready");
    expect(snap.degradedNote).toBeUndefined();
  });

  it("captures templates fetch error in degradedNote", async () => {
    const GET = vi.fn(async (path: string) => {
      if (path === "/reports/templates") {
        throw new ApiError({
          status: 503,
          url: "/reports/templates",
          code: "REPORTING_SERVICE_DEGRADED",
          message: "Reporting service is degraded.",
        });
      }
      return {
        data: {
          reportId: "RPT-EXM-2026-0337",
          reportType: "examProtocol",
          status: "ready",
          format: "pdf",
          examRef: { examId: "EXM-2026-0337" },
          requestedAt: "2026-06-19T12:00:00Z",
          generatedAt: "2026-06-19T12:18:42Z",
        },
      };
    });
    const api = makeApi({
      reportingDocument: {
        GET,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const snap = await liveReportingLoader(api, ["RPT-EXM-2026-0337"]);
    expect(snap.templates).toEqual([]);
    expect(snap.degradedNote).toMatch(/degraded/i);
    // Reports still loaded.
    expect(snap.reports[0]!.status).toBe("ready");
  });

  it("falls back to mock row + fetchError per-report when /reports/{id} fails", async () => {
    const GET = vi.fn(async (path: string) => {
      if (path === "/reports/templates") {
        return { data: { items: [] } };
      }
      throw new ApiError({
        status: 404,
        url: path,
        code: "REPORT_NOT_FOUND",
        message: "Report not found.",
      });
    });
    const api = makeApi({
      reportingDocument: {
        GET,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const snap = await liveReportingLoader(api, ["RPT-EXM-2026-0337"]);
    expect(snap.reports[0]!.reportId).toBe("RPT-EXM-2026-0337");
    expect(snap.reports[0]!.fetchError).toMatch(/not found/i);
  });

  it("uses unknown stub when fetch fails and no mock row available", async () => {
    const GET = vi.fn(async (path: string) => {
      if (path === "/reports/templates") {
        return { data: { items: [] } };
      }
      throw new Error("network");
    });
    const api = makeApi({
      reportingDocument: {
        GET,
      } as unknown as AutodromeApi["reportingDocument"],
    });
    const snap = await liveReportingLoader(api, ["RPT-DOES-NOT-EXIST"]);
    expect(snap.reports[0]!.status).toBe("unknown");
    expect(snap.reports[0]!.fetchError).toBe("network");
  });
});
