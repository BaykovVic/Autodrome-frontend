/**
 * Console-shaped evidence snapshot.
 *
 * Canonical media-archive-service OpenAPI contract has no
 * `GET /evidence` list operation today; the inspector surface
 * stays fixture-driven until a list read model lands.
 *
 * The visual surface adds design-only blocks (per-evidence
 * SHA-256 short form, modality chip palette, offline preview
 * placeholder, sealed/pending/failed status). All evidence here is
 * sealed reference metadata only — no real binary playback or
 * export ever fires.
 */
export type ConsoleEvidenceType =
  | "telemetry"
  | "video"
  | "photo"
  | "audio"
  | "biometry";

export type ConsoleEvidenceStatus = "sealed" | "pending" | "failed";

export type ConsoleEvidence = {
  id: string;
  examId: string;
  type: ConsoleEvidenceType;
  typeLabel: string;
  captured: string;
  size: string;
  status: ConsoleEvidenceStatus;
  statusLabel: string;
  sha256: string;
  previewAvailable: boolean;
};

export type ConsoleEvidenceSnapshot = {
  totals: {
    evidence: number;
    sealed: number;
    failed: number;
  };
  degraded: boolean;
  evidence: ConsoleEvidence[];
};

/**
 * Console-shaped detail view-model for a single evidence record.
 *
 * Tracks linked media-archive recordings + reporting-document
 * reports so the operator can see refs and timestamps without
 * us pretending playback or export is ready. Per spec rule
 * "no fake playback/export readiness", the screen always
 * surfaces an explicit "playback unavailable" / "export
 * unavailable" affordance — playback / export are gated by
 * future features (`frontend-media-playback-degraded-states`,
 * `frontend-reporting-live-api-integration`).
 *
 * `mediaRefs` mirrors the canonical
 * `media-archive-service.PlaybackManifest` boundary —
 * recordingId + status + per-source segment count + manifest
 * expiry. `reportRefs` mirrors
 * `reporting-document-service.Report` — reportId + status +
 * generatedAt. Both surfaces gracefully degrade per ref:
 * a fetch failure populates `manifestError` / `reportError`
 * fields and leaves the rest of the screen functional.
 */
export type ConsoleEvidenceMediaSourceKind =
  | "cabinFront"
  | "cabinSide"
  | "exteriorFront"
  | "exteriorRear"
  | "microphone";

export type ConsoleEvidenceMediaRecordingStatus =
  | "active"
  | "finalized"
  | "failed"
  | "unknown";

/**
 * Per-segment metadata surfaced from canonical
 * `MediaSegment` shape. Operator видит каждый сегмент
 * recording: source token, временное окно, checksum
 * (короткий hash для compact rendering). Полный
 * `objectKey` намеренно не показываем — это opaque
 * storage key, не для operator view.
 */
export type ConsoleEvidenceMediaSegment = {
  segmentId: string;
  source: ConsoleEvidenceMediaSourceKind;
  sourceLabel: string;
  startedAt: string;
  endedAt: string;
  /** Short hash (e.g. `a1f4…9c20`) for compact rendering. */
  checksumShort: string;
};

/**
 * Per-source playback timeline mapping entry surfaced from
 * canonical `PlaybackTimelineMapping` shape.
 */
export type ConsoleEvidenceMediaTimelineEntry = {
  timelineFrom: string;
  timelineTo: string;
  source: ConsoleEvidenceMediaSourceKind;
  sourceLabel: string;
  segmentId: string;
};

export type ConsoleEvidenceMediaRef = {
  recordingId: string;
  status: ConsoleEvidenceMediaRecordingStatus;
  statusLabel: string;
  /** Source kinds present on the recording (camera/mic/etc). */
  sources: ConsoleEvidenceMediaSourceKind[];
  /** Total registered segments across all sources. */
  segmentCount: number;
  /** ISO timestamp from PlaybackManifest.expiresAt or `"—"`. */
  manifestExpiresAt: string;
  /** Per-segment metadata when manifest is sealed. */
  segments?: ConsoleEvidenceMediaSegment[];
  /** Timeline mapping entries when manifest is sealed. */
  timeline?: ConsoleEvidenceMediaTimelineEntry[];
  /** Optional error string when manifest fetch failed (degraded). */
  manifestError?: string;
};

export type ConsoleEvidenceReportStatus =
  | "generating"
  | "ready"
  | "failed"
  | "unknown";

export type ConsoleEvidenceReportRef = {
  reportId: string;
  status: ConsoleEvidenceReportStatus;
  statusLabel: string;
  generatedAt: string;
  /** Optional error string when report fetch failed. */
  reportError?: string;
};

export type ConsoleExamMediaIndexRecording = {
  recordingId: string;
  sessionId?: string;
  evidenceType?: string;
  status: ConsoleEvidenceMediaRecordingStatus;
  statusLabel: string;
  startedAt: string;
  finalizedAt?: string;
  segmentCount: number;
};

/**
 * Read model surfaced by canonical
 * `GET /media/exams/{examId}/media` → `ExamMediaIndex`.
 *
 * The Evidence detail screen renders this list as the "Exam media
 * index" panel so the operator sees every recording attached to the
 * parent exam — not only the ones already linked to the inspected
 * evidence record. When the backend endpoint is unavailable, the
 * panel shows the captured `indexError` string and renders the
 * per-evidence media refs unchanged (per spec rule "no fake playback
 * readiness; degraded state explicit").
 */
export type ConsoleExamMediaIndex = {
  examId: string;
  recordings: ConsoleExamMediaIndexRecording[];
  indexError?: string;
};

export type ConsoleEvidenceDetail = {
  /** Base record. */
  evidence: ConsoleEvidence;
  /** Linked media recordings (zero when evidence has no media). */
  mediaRefs: ConsoleEvidenceMediaRef[];
  /** Linked reporting documents (zero when no report exists yet). */
  reportRefs: ConsoleEvidenceReportRef[];
  /** Exam-wide media index (optional; only populated in live mode). */
  examMediaIndex?: ConsoleExamMediaIndex;
  /** Operator audit notes (optional). */
  notes?: string;
};

export const EVIDENCE_MEDIA_SOURCE_LABELS: Record<
  ConsoleEvidenceMediaSourceKind,
  string
> = {
  cabinFront: "Cabin front",
  cabinSide: "Cabin side",
  exteriorFront: "Exterior front",
  exteriorRear: "Exterior rear",
  microphone: "Microphone",
};

export const EVIDENCE_MEDIA_STATUS_LABELS: Record<
  ConsoleEvidenceMediaRecordingStatus,
  string
> = {
  active: "Active",
  finalized: "Finalized",
  failed: "Failed",
  unknown: "Unknown",
};

export const EVIDENCE_REPORT_STATUS_LABELS: Record<
  ConsoleEvidenceReportStatus,
  string
> = {
  generating: "Generating",
  ready: "Ready",
  failed: "Failed",
  unknown: "Unknown",
};
