/**
 * Live Reporting workspace loader + DTO→view-model mappers.
 *
 * Wires `/reporting` workspace to the typed
 * `reporting-document-service` client. Mock mode keeps using
 * scenario fixtures.
 *
 * Coverage vs. canonical contract:
 *   - `GET /reports/templates` →
 *     `liveReportingTemplatesLoader`.
 *   - `GET /reports/{reportId}` → per-id read for the
 *     "recent reports" list (frontend keeps the list of
 *     observed `reportId`s from the evidence detail
 *     workflow; here we just expose the same canonical
 *     fixture ids).
 *
 * Per spec rule "rendering/export unavailable states
 * explicit": rendering + export remain disabled
 * affordances; this loader doesn't fabricate ready state.
 *
 * Tech debt:
 *   - No canonical `/reports?examId=` list endpoint; the
 *     "recent reports" view keeps a frontend-curated id
 *     list and per-id fetch falls back to the mock report
 *     row on failure (degraded surface).
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/reporting-document";

import {
  REPORTING_FORMAT_LABELS,
  REPORTING_STATUS_LABELS,
  REPORTING_TYPE_LABELS,
  type ConsoleReportFormat,
  type ConsoleReportStatus,
  type ConsoleReportType,
  type ConsoleReportingReport,
  type ConsoleReportingSnapshot,
  type ConsoleReportingTemplate,
} from "./consoleReportingSnapshot";
import {
  __REPORTING_FIXTURE_REPORT_IDS__,
  consoleReportingFor,
} from "./consoleReportingFixtures";

type TemplateDto = components["schemas"]["Template"];
type ReportDto = components["schemas"]["Report"];
type ReportTypeDto = components["schemas"]["ReportType"];
type ReportFormatDto = components["schemas"]["ReportFormat"];
type ReportStatusDto = components["schemas"]["ReportStatus"];
type ExamProtocolRequestDto =
  components["schemas"]["ExamProtocolRequest"];
type ExamProtocolResultDto =
  components["schemas"]["ExamProtocolResult"];

export function mapReportTypeDtoToConsole(
  dto: ReportTypeDto,
): ConsoleReportType {
  // Canonical enums match 1:1.
  return dto as ConsoleReportType;
}

export function mapReportFormatDtoToConsole(
  dto: ReportFormatDto,
): ConsoleReportFormat {
  return dto as ConsoleReportFormat;
}

export function mapReportStatusDtoToConsoleReporting(
  dto: ReportStatusDto,
): ConsoleReportStatus {
  switch (dto) {
    case "accepted":
    case "inProgress":
    case "ready":
    case "failed":
      return dto;
    default:
      return "unknown";
  }
}

export function mapTemplateDtoToConsole(
  dto: TemplateDto,
): ConsoleReportingTemplate {
  const reportType = mapReportTypeDtoToConsole(dto.reportType);
  return {
    templateId: dto.templateId,
    name: dto.name,
    reportType,
    reportTypeLabel: REPORTING_TYPE_LABELS[reportType],
    version: dto.version,
    publishedAt: dto.publishedAt ?? "—",
  };
}

export function mapReportDtoToConsole(
  dto: ReportDto,
): ConsoleReportingReport {
  const reportType = mapReportTypeDtoToConsole(dto.reportType);
  const format = mapReportFormatDtoToConsole(dto.format ?? "pdf");
  const status = mapReportStatusDtoToConsoleReporting(dto.status);
  return {
    reportId: dto.reportId,
    reportType,
    reportTypeLabel: REPORTING_TYPE_LABELS[reportType],
    status,
    statusLabel: REPORTING_STATUS_LABELS[status],
    format,
    formatLabel: REPORTING_FORMAT_LABELS[format],
    examId: dto.examRef?.examId ?? "—",
    requestedAt: dto.requestedAt,
    generatedAt: dto.generatedAt ?? "—",
  };
}

function explain(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Backend fetch failed.";
}

function templateTotals(
  templates: readonly ConsoleReportingTemplate[],
): { templates: number; publishedTemplates: number } {
  return {
    templates: templates.length,
    publishedTemplates: templates.filter((t) => t.publishedAt !== "—")
      .length,
  };
}

function reportTotals(
  reports: readonly ConsoleReportingReport[],
): { reports: number; readyReports: number; failedReports: number } {
  return {
    reports: reports.length,
    readyReports: reports.filter((r) => r.status === "ready").length,
    failedReports: reports.filter((r) => r.status === "failed").length,
  };
}

/**
 * Console view-model surfaced to the operator after the protocol
 * generation request. Preserves canonical fields + the degraded
 * flag + the missing-evidence list so the screen can decide
 * whether to surface a "degraded" badge / warning.
 */
export type ConsoleProtocolRequestResult = {
  reportId: string;
  examId: string;
  status: ConsoleReportStatus;
  statusLabel: string;
  degraded: boolean;
  missingEvidence: string[];
  snapshotHash: string;
  violationCount: number;
  mediaCount: number;
  audioCount: number;
  biometryCount: number;
  generatedAt: string;
};

export function mapExamProtocolResultDtoToConsole(
  dto: ExamProtocolResultDto,
): ConsoleProtocolRequestResult {
  const status = mapReportStatusDtoToConsoleReporting(dto.status);
  return {
    reportId: dto.reportId,
    examId: dto.examId,
    status,
    statusLabel: REPORTING_STATUS_LABELS[status],
    degraded: dto.degraded,
    missingEvidence: dto.missingEvidence,
    snapshotHash: dto.snapshotHash,
    violationCount: dto.violationCount,
    mediaCount: dto.mediaCount,
    audioCount: dto.audioCount,
    biometryCount: dto.biometryCount,
    generatedAt: dto.generatedAt,
  };
}

/**
 * POST `/reports/exams/{examId}/protocol` — compose an exam
 * protocol with evidence references. Backend is idempotent
 * за счёт Idempotency-Key (UUID per call).
 *
 * The full request shape is the operator's responsibility (which
 * evidence refs to include); this helper only adds the
 * Idempotency-Key + the path param and maps the canonical result
 * to the operator-facing view-model.
 */
export async function liveExamProtocolRequest(
  adapter: AutodromeApi,
  examId: string,
  request: ExamProtocolRequestDto,
): Promise<ConsoleProtocolRequestResult> {
  const result = await adapter.reportingDocument.POST(
    "/reports/exams/{examId}/protocol",
    {
      params: {
        path: { examId },
        header: { "Idempotency-Key": newCorrelationId() },
      },
      body: request,
    },
  );
  const dto = result.data as ExamProtocolResultDto | undefined;
  if (!dto) {
    throw new Error(
      "reporting-document-service returned an empty body for protocol POST",
    );
  }
  return mapExamProtocolResultDtoToConsole(dto);
}

export async function liveReportingLoader(
  adapter: AutodromeApi,
  knownReportIds: readonly string[] = __REPORTING_FIXTURE_REPORT_IDS__,
): Promise<ConsoleReportingSnapshot> {
  // Templates
  let templates: ConsoleReportingTemplate[] = [];
  let templatesError: string | undefined;
  try {
    const result = await adapter.reportingDocument.GET(
      "/reports/templates",
      {},
    );
    const page = (result.data ?? { items: [] }) as {
      items?: TemplateDto[];
    };
    templates = (page.items ?? []).map(mapTemplateDtoToConsole);
  } catch (error) {
    templatesError = explain(error);
  }

  // Recent reports: per-id fetch with per-report fallback.
  const reports: ConsoleReportingReport[] = await Promise.all(
    knownReportIds.map(async (reportId) => {
      try {
        const result = await adapter.reportingDocument.GET(
          "/reports/{reportId}",
          {
            params: { path: { reportId } },
          },
        );
        const dto = result.data as ReportDto | undefined;
        if (!dto) {
          throw new Error("Report endpoint returned no body.");
        }
        return mapReportDtoToConsole(dto);
      } catch (error) {
        // Fall back to mock row so the operator still sees
        // the id and can take action; mark fetchError so
        // the row renders в degraded mode.
        const mockSnapshot = consoleReportingFor("normal");
        const mock = mockSnapshot.reports.find(
          (r) => r.reportId === reportId,
        );
        if (mock) {
          return { ...mock, fetchError: explain(error) };
        }
        return {
          reportId,
          reportType: "examProtocol",
          reportTypeLabel: REPORTING_TYPE_LABELS.examProtocol,
          status: "unknown" as const,
          statusLabel: REPORTING_STATUS_LABELS.unknown,
          format: "pdf" as const,
          formatLabel: REPORTING_FORMAT_LABELS.pdf,
          examId: "—",
          requestedAt: "—",
          generatedAt: "—",
          fetchError: explain(error),
        };
      }
    }),
  );

  return {
    totals: {
      ...templateTotals(templates),
      ...reportTotals(reports),
    },
    templates,
    reports,
    degradedNote: templatesError,
  };
}
