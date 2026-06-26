import type { MockScenario } from "@/api/mock/scenarios";

import {
  REPORTING_FORMAT_LABELS,
  REPORTING_STATUS_LABELS,
  REPORTING_TYPE_LABELS,
  type ConsoleReportingSnapshot,
  type ConsoleReportingReport,
  type ConsoleReportingTemplate,
} from "./consoleReportingSnapshot";

const T1: ConsoleReportingTemplate = {
  templateId: "TPL-EXM-DEFAULT",
  name: "Exam protocol · default",
  reportType: "examProtocol",
  reportTypeLabel: REPORTING_TYPE_LABELS.examProtocol,
  version: 7,
  publishedAt: "2026-06-10T09:00:00Z",
};

const T2: ConsoleReportingTemplate = {
  templateId: "TPL-EXM-RESULT",
  name: "Exam result · v2",
  reportType: "examResult",
  reportTypeLabel: REPORTING_TYPE_LABELS.examResult,
  version: 2,
  publishedAt: "2026-06-14T08:30:00Z",
};

const T3: ConsoleReportingTemplate = {
  templateId: "TPL-VIOL-JOURNAL",
  name: "Violation journal · pilot",
  reportType: "violationJournal",
  reportTypeLabel: REPORTING_TYPE_LABELS.violationJournal,
  version: 1,
  publishedAt: "—",
};

const T4: ConsoleReportingTemplate = {
  templateId: "TPL-MEDIA-INDEX",
  name: "Media index · monthly",
  reportType: "mediaIndex",
  reportTypeLabel: REPORTING_TYPE_LABELS.mediaIndex,
  version: 3,
  publishedAt: "2026-06-01T10:00:00Z",
};

const R_READY: ConsoleReportingReport = {
  reportId: "RPT-EXM-2026-0337",
  reportType: "examProtocol",
  reportTypeLabel: REPORTING_TYPE_LABELS.examProtocol,
  status: "ready",
  statusLabel: REPORTING_STATUS_LABELS.ready,
  format: "pdf",
  formatLabel: REPORTING_FORMAT_LABELS.pdf,
  examId: "EXM-2026-0337",
  requestedAt: "2026-06-19T12:00:00Z",
  generatedAt: "2026-06-19T12:18:42Z",
};

const R_GENERATING: ConsoleReportingReport = {
  reportId: "RPT-EXM-2026-0338",
  reportType: "examProtocol",
  reportTypeLabel: REPORTING_TYPE_LABELS.examProtocol,
  status: "inProgress",
  statusLabel: REPORTING_STATUS_LABELS.inProgress,
  format: "pdf",
  formatLabel: REPORTING_FORMAT_LABELS.pdf,
  examId: "EXM-2026-0338",
  requestedAt: "2026-06-19T15:21:00Z",
  generatedAt: "—",
};

const R_FAILED: ConsoleReportingReport = {
  reportId: "RPT-EXM-2026-0334",
  reportType: "examProtocol",
  reportTypeLabel: REPORTING_TYPE_LABELS.examProtocol,
  status: "failed",
  statusLabel: REPORTING_STATUS_LABELS.failed,
  format: "pdf",
  formatLabel: REPORTING_FORMAT_LABELS.pdf,
  examId: "EXM-2026-0334",
  requestedAt: "2026-06-19T10:00:00Z",
  generatedAt: "—",
};

const BASE_TEMPLATES = [T1, T2, T3, T4];
const BASE_REPORTS = [R_READY, R_GENERATING, R_FAILED];

function totals(
  templates: ConsoleReportingTemplate[],
  reports: ConsoleReportingReport[],
) {
  return {
    templates: templates.length,
    publishedTemplates: templates.filter(
      (t) => t.publishedAt !== "—",
    ).length,
    reports: reports.length,
    readyReports: reports.filter((r) => r.status === "ready").length,
    failedReports: reports.filter((r) => r.status === "failed").length,
  };
}

const NORMAL: ConsoleReportingSnapshot = {
  totals: totals(BASE_TEMPLATES, BASE_REPORTS),
  templates: BASE_TEMPLATES,
  reports: BASE_REPORTS,
};

const SERVICE_DEGRADED: ConsoleReportingSnapshot = {
  totals: totals([T1], [R_FAILED]),
  templates: [T1],
  reports: [R_FAILED],
  degradedNote:
    "Reporting service is degraded — only the published default template is reachable.",
};

const EMPTY: ConsoleReportingSnapshot = {
  totals: totals([], []),
  templates: [],
  reports: [],
};

export function consoleReportingFor(
  scenario: MockScenario,
): ConsoleReportingSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    case "violations-detected":
    case "exam-in-progress":
    default:
      return NORMAL;
  }
}

export const __REPORTING_FIXTURE_TEMPLATE_IDS__ = BASE_TEMPLATES.map(
  (t) => t.templateId,
);

export const __REPORTING_FIXTURE_REPORT_IDS__ = BASE_REPORTS.map(
  (r) => r.reportId,
);
