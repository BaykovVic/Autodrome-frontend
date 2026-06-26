/**
 * Console-shaped audit workspace snapshot.
 *
 * Surfaces canonical `audit-service` concepts:
 *   - Recent audit events (`GET /audit/events`).
 *   - Verification report (`POST /audit/verify` →
 *     `AuditVerificationReport`).
 *   - Export job result (`POST /audit/export` →
 *     `AuditExport`).
 *
 * Per spec rule "Frontend не пересчитывает hash chain":
 * verification status приходит от backend; frontend
 * только rendering. Export action dispatches POST с
 * idempotency-key; download artifact path не вычисляется
 * client-side.
 */

export type ConsoleAuditVerificationStatus = "passed" | "failed";

export type ConsoleAuditExportFormat = "jsonl" | "csv";

export type ConsoleAuditEvent = {
  eventId: string;
  /** Mono short representation (e.g. "00000000…00aa"). */
  eventIdShort: string;
  actorId: string;
  /** e.g. "operator.login", "candidate.enroll". */
  action: string;
  /** Affected subject (id or label). */
  subject: string;
  occurredAt: string;
  /** Hex SHA-256 short form (`a1f4…9c20`). */
  payloadHashShort: string;
  sequence: number;
  recordedAt: string;
};

export type ConsoleAuditVerification = {
  runId: string;
  status: ConsoleAuditVerificationStatus;
  statusLabel: string;
  checkedBlocks: number;
  firstErrorBlockId?: string;
  firstError?: string;
  ranAt: string;
};

export type ConsoleAuditExport = {
  exportId: string;
  format: ConsoleAuditExportFormat;
  formatLabel: string;
  eventCount: number;
  occurredAtFrom?: string;
  occurredAtTo?: string;
  createdAt: string;
};

export type ConsoleAuditSnapshot = {
  totals: {
    events: number;
    /** Display marker — backend exposes integer sequence,
     * we keep latest for header. */
    latestSequence: number;
  };
  events: ConsoleAuditEvent[];
  /** Last completed verification (mock seeds one). */
  lastVerification?: ConsoleAuditVerification;
  /** Last completed export (mock seeds one). */
  lastExport?: ConsoleAuditExport;
  /** Honest degraded note when backend can't be reached. */
  degradedNote?: string;
};

export const AUDIT_VERIFICATION_STATUS_LABELS: Record<
  ConsoleAuditVerificationStatus,
  string
> = {
  passed: "Passed",
  failed: "Failed",
};

export const AUDIT_EXPORT_FORMAT_LABELS: Record<
  ConsoleAuditExportFormat,
  string
> = {
  jsonl: "JSON Lines",
  csv: "CSV",
};
