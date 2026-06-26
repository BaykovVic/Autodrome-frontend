/**
 * Live audit workspace loader + verification + export
 * commands.
 *
 * Wires the `/audit` workspace to canonical
 * `audit-service` v1:
 *   - `GET /audit/events` → recent events list.
 *   - `POST /audit/verify` → verification report.
 *   - `POST /audit/export` → export job.
 *
 * Per spec rule "Frontend не пересчитывает hash chain":
 * verification logic полностью backend; frontend получает
 * report и рендерит честный status + checked blocks +
 * first error если есть. Никакого client-side hash
 * recomputation.
 *
 * Idempotency-Key generated per command через
 * `newCorrelationId()` (UUID).
 */

import { newCorrelationId } from "@/api/correlation";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/audit";

import {
  AUDIT_EXPORT_FORMAT_LABELS,
  AUDIT_VERIFICATION_STATUS_LABELS,
  type ConsoleAuditEvent,
  type ConsoleAuditExport,
  type ConsoleAuditExportFormat,
  type ConsoleAuditSnapshot,
  type ConsoleAuditVerification,
  type ConsoleAuditVerificationStatus,
} from "./consoleAuditSnapshot";

type AuditEventDto = components["schemas"]["AuditEvent"];
type AuditEventsPageDto = components["schemas"]["AuditEventsPage"];
type VerificationReportDto =
  components["schemas"]["AuditVerificationReport"];
type ExportDto = components["schemas"]["AuditExport"];
type ExportRequestDto =
  components["schemas"]["AuditExportRequest"];

function shortHash(full: string): string {
  if (!full || full.length <= 12) return full ?? "—";
  return `${full.slice(0, 4)}…${full.slice(-4)}`;
}

function shortId(full: string): string {
  if (!full || full.length <= 12) return full ?? "—";
  return `${full.slice(0, 4)}…${full.slice(-4)}`;
}

export function mapAuditEventDtoToConsole(
  dto: AuditEventDto,
): ConsoleAuditEvent {
  return {
    eventId: dto.eventId,
    eventIdShort: shortId(dto.eventId),
    actorId: dto.actor.actorId,
    action: dto.action,
    subject: dto.subject,
    occurredAt: dto.occurredAt,
    payloadHashShort: shortHash(dto.payloadHash),
    sequence: dto.sequence,
    recordedAt: dto.recordedAt,
  };
}

export function mapVerificationReportDtoToConsole(
  dto: VerificationReportDto,
): ConsoleAuditVerification {
  const status = dto.status as ConsoleAuditVerificationStatus;
  return {
    runId: dto.runId,
    status,
    statusLabel: AUDIT_VERIFICATION_STATUS_LABELS[status],
    checkedBlocks: dto.checkedBlocks,
    firstErrorBlockId: dto.firstErrorBlockId,
    firstError: dto.firstError,
    ranAt: dto.ranAt,
  };
}

export function mapExportDtoToConsole(
  dto: ExportDto,
): ConsoleAuditExport {
  const format = dto.format as ConsoleAuditExportFormat;
  return {
    exportId: dto.exportId,
    format,
    formatLabel: AUDIT_EXPORT_FORMAT_LABELS[format],
    eventCount: dto.eventCount,
    occurredAtFrom: dto.occurredAtFrom,
    occurredAtTo: dto.occurredAtTo,
    createdAt: dto.createdAt,
  };
}

function idempotencyKey(): string {
  return newCorrelationId();
}

export async function liveAuditEventsLoader(
  adapter: AutodromeApi,
): Promise<ConsoleAuditSnapshot> {
  try {
    const result = await adapter.audit.GET("/audit/events", {});
    const page = (result.data ?? { items: [] }) as AuditEventsPageDto;
    const events = (page.items ?? []).map(mapAuditEventDtoToConsole);
    const latestSequence = events.reduce(
      (acc, e) => Math.max(acc, e.sequence),
      0,
    );
    return {
      totals: { events: events.length, latestSequence },
      events,
    };
  } catch (error) {
    return {
      totals: { events: 0, latestSequence: 0 },
      events: [],
      degradedNote:
        error instanceof Error
          ? error.message
          : "Audit events endpoint failed.",
    };
  }
}

export async function liveAuditVerify(
  adapter: AutodromeApi,
): Promise<ConsoleAuditVerification> {
  const result = await adapter.audit.POST("/audit/verify", {
    params: {
      header: { "Idempotency-Key": idempotencyKey() },
    },
  });
  const dto = result.data as VerificationReportDto | undefined;
  if (!dto) throw new Error("Verify endpoint returned no body.");
  return mapVerificationReportDtoToConsole(dto);
}

export async function liveAuditExport(
  adapter: AutodromeApi,
  body: ExportRequestDto,
): Promise<ConsoleAuditExport> {
  const result = await adapter.audit.POST("/audit/export", {
    body,
    params: {
      header: { "Idempotency-Key": idempotencyKey() },
    },
  });
  const dto = result.data as ExportDto | undefined;
  if (!dto) throw new Error("Export endpoint returned no body.");
  return mapExportDtoToConsole(dto);
}
