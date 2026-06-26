/**
 * Console-shaped reporting workspace snapshot.
 *
 * Surfaces the canonical
 * `reporting-document-service` reads:
 *
 *   - `GET /reports/templates` → published templates that
 *     the operator can target when requesting an exam
 *     report.
 *   - `GET /reports/{reportId}` (per known report id) →
 *     status of recent reports.
 *
 * Mock fallback preserved. Rendering and export are
 * intentionally treated as unavailable per spec rule
 * "rendering/export unavailable states explicit" — those
 * land with `frontend-media-playback-degraded-states` and
 * the dedicated reporting export feature.
 *
 * Canonical naming compliance: ReportType, ReportFormat,
 * ReportStatus tokens from `reporting-document-service`
 * surface to the operator as canonical mono chips
 * alongside human labels.
 */

export type ConsoleReportType =
  | "examProtocol"
  | "examResult"
  | "violationJournal"
  | "telemetryTimeline"
  | "biometryChecks"
  | "audioTriggerJournal"
  | "mediaIndex"
  | "auditExport"
  | "equipmentHealth";

export type ConsoleReportFormat = "pdf" | "html" | "structured";

export type ConsoleReportStatus =
  | "accepted"
  | "inProgress"
  | "ready"
  | "failed"
  | "unknown";

export type ConsoleReportingTemplate = {
  templateId: string;
  /** Operator-facing short name (e.g. "Exam protocol · default"). */
  name: string;
  /** Canonical report type backed by the template. */
  reportType: ConsoleReportType;
  reportTypeLabel: string;
  /** Template version (>= 1). */
  version: number;
  /** Published or `"—"` when template not yet published. */
  publishedAt: string;
};

export type ConsoleReportingReport = {
  reportId: string;
  reportType: ConsoleReportType;
  reportTypeLabel: string;
  status: ConsoleReportStatus;
  statusLabel: string;
  format: ConsoleReportFormat;
  formatLabel: string;
  /** Linked exam ref (canonical id), `"—"` if not bound. */
  examId: string;
  requestedAt: string;
  generatedAt: string;
  /** Optional per-report error string for degraded surfaces. */
  fetchError?: string;
};

export type ConsoleReportingSnapshot = {
  totals: {
    templates: number;
    publishedTemplates: number;
    reports: number;
    readyReports: number;
    failedReports: number;
  };
  templates: ConsoleReportingTemplate[];
  reports: ConsoleReportingReport[];
  /** Operator-visible note when service is degraded. */
  degradedNote?: string;
};

export const REPORTING_TYPE_LABELS: Record<ConsoleReportType, string> = {
  examProtocol: "Exam protocol",
  examResult: "Exam result",
  violationJournal: "Violation journal",
  telemetryTimeline: "Telemetry timeline",
  biometryChecks: "Biometry checks",
  audioTriggerJournal: "Audio trigger journal",
  mediaIndex: "Media index",
  auditExport: "Audit export",
  equipmentHealth: "Equipment health",
};

export const REPORTING_FORMAT_LABELS: Record<
  ConsoleReportFormat,
  string
> = {
  pdf: "PDF",
  html: "HTML",
  structured: "Structured",
};

export const REPORTING_STATUS_LABELS: Record<
  ConsoleReportStatus,
  string
> = {
  accepted: "Accepted",
  inProgress: "In progress",
  ready: "Ready",
  failed: "Failed",
  unknown: "Unknown",
};
