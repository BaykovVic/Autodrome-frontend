/**
 * Console-shaped exam evidence timeline.
 *
 * Backend canonical contract (`GET /exams/{examId}/evidence-timeline`)
 * returns minimal entries: `sourceType`, `refKind`, optional `refId`,
 * `occurredAt`, optional `label`, optional `severity`. The visual
 * surface adds:
 *   - operator-facing label fallback ("media segment" instead of
 *     `mediaSegment`),
 *   - severity tone for the status-dot primitive,
 *   - linkHref when refKind is known to map to an operator-visible
 *     screen (`media`, `evidence`).
 *
 * Source taxonomy mirrors the backend baseline canonical sourceType
 * vocabulary; unknown sourceType is preserved verbatim and shown
 * under the "other" filter chip so unknown UI does not silently
 * drop events.
 */

export type ConsoleEvidenceSource =
  | "lifecycle"
  | "violation"
  | "telemetry"
  | "media"
  | "biometry"
  | "audio"
  | "other";

export const CONSOLE_EVIDENCE_SOURCES: readonly ConsoleEvidenceSource[] = [
  "lifecycle",
  "violation",
  "telemetry",
  "media",
  "biometry",
  "audio",
  "other",
];

export const EVIDENCE_SOURCE_LABELS: Record<ConsoleEvidenceSource, string> = {
  lifecycle: "Lifecycle",
  violation: "Violation",
  telemetry: "Telemetry",
  media: "Media",
  biometry: "Biometry",
  audio: "Audio trigger",
  other: "Other",
};

export type ConsoleEvidenceTone =
  | "online"
  | "degraded"
  | "offline"
  | "standby";

export type ConsoleEvidenceTimelineEntry = {
  /** Stable key for React lists: `${sourceType}:${refKind}:${refId ?? occurredAt}`. */
  key: string;
  sourceType: string;
  source: ConsoleEvidenceSource;
  sourceLabel: string;
  refKind: string;
  refId?: string;
  occurredAt: string;
  label: string;
  severity?: string;
  tone: ConsoleEvidenceTone;
  /** Operator-visible deep link when refKind maps to a known surface. */
  linkHref?: string;
};

export type ConsoleEvidenceTimelineSnapshot = {
  examId: string;
  entries: ConsoleEvidenceTimelineEntry[];
  nextPageToken?: string;
};

export function normalizeEvidenceSource(
  sourceType: string,
): ConsoleEvidenceSource {
  const s = sourceType.toLowerCase();
  if (s === "lifecycle" || s === "exam-lifecycle") return "lifecycle";
  if (s === "violation" || s === "violation-rule") return "violation";
  if (s === "telemetry" || s === "vehicle-telemetry") return "telemetry";
  if (s === "media" || s === "media-archive") return "media";
  if (s === "biometry" || s === "biometry-service") return "biometry";
  if (s === "audio" || s === "audio-trigger") return "audio";
  return "other";
}

export function evidenceToneForSeverity(
  severity: string | undefined,
): ConsoleEvidenceTone {
  if (!severity) return "standby";
  const s = severity.toLowerCase();
  if (s === "critical" || s === "blocking" || s === "error") return "offline";
  if (s === "warning" || s === "degraded") return "degraded";
  if (s === "info" || s === "ok") return "online";
  return "standby";
}

export function evidenceLinkHref(
  refKind: string,
  refId: string | undefined,
): string | undefined {
  if (!refId) return undefined;
  const kind = refKind.toLowerCase();
  if (kind === "media-segment" || kind === "mediasegment" || kind === "media") {
    return `/evidence/${refId}`;
  }
  if (kind === "evidence" || kind === "evidenceitem") {
    return `/evidence/${refId}`;
  }
  return undefined;
}
