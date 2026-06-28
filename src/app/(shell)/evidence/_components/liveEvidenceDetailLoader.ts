/**
 * Live Evidence Detail loader.
 *
 * No top-level `evidence-service` canonical contract exists
 * today, so the base evidence record stays mock-first (sourced
 * from `consoleEvidenceDetailFor`). Per ref present in the
 * fixture, the loader enriches metadata from canonical APIs:
 *
 *   - `mediaRefs[].recordingId` →
 *     `GET /media/recordings/{recordingId}/manifest` →
 *     `segmentCount` + `manifestExpiresAt` overridden by the
 *     backend response. A non-2xx response is captured into
 *     `manifestError` and leaves the rest of the screen
 *     functional (per spec rule "explicit unavailable states
 *     for playback").
 *   - `reportRefs[].reportId` → `GET /reports/{reportId}` →
 *     `status` + `generatedAt` overridden by the backend
 *     response. A non-2xx response is captured into
 *     `reportError`.
 *
 * Per spec rule "no fake playback/export readiness", the
 * screen never enables playback or export buttons — those
 * land with the dedicated playback/export features.
 *
 * Tech debt:
 *   - Base evidence record is mock-sourced. When an
 *     `evidence-service` HTTP read model appears in canonical
 *     contracts, the base record fetch belongs here too.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components as MediaArchiveComponents } from "@/contracts/types/media-archive";
import type { components as ReportingComponents } from "@/contracts/types/reporting-document";

import { consoleEvidenceDetailFor } from "./consoleEvidenceDetailFixtures";
import {
  EVIDENCE_MEDIA_SOURCE_LABELS,
  EVIDENCE_MEDIA_STATUS_LABELS,
  EVIDENCE_REPORT_STATUS_LABELS,
  type ConsoleEvidenceDetail,
  type ConsoleEvidenceMediaRecordingStatus,
  type ConsoleEvidenceMediaRef,
  type ConsoleEvidenceMediaSegment,
  type ConsoleEvidenceMediaSourceKind,
  type ConsoleEvidenceMediaTimelineEntry,
  type ConsoleEvidenceReportRef,
  type ConsoleEvidenceReportStatus,
  type ConsoleExamMediaIndex,
  type ConsoleExamMediaIndexRecording,
} from "./consoleEvidenceSnapshot";

type PlaybackManifestDto =
  MediaArchiveComponents["schemas"]["PlaybackManifest"];
type MediaSourceKindDto =
  MediaArchiveComponents["schemas"]["MediaSource"]["kind"];
type ReportDto = ReportingComponents["schemas"]["Report"];
type ReportStatusDto = ReportingComponents["schemas"]["ReportStatus"];
type ExamMediaIndexDto =
  MediaArchiveComponents["schemas"]["ExamMediaIndex"];
type ExamMediaRecordingDto =
  MediaArchiveComponents["schemas"]["ExamMediaRecording"];
type MediaRecordingStatusDto =
  MediaArchiveComponents["schemas"]["MediaRecordingStatus"];

function isKnownSourceKind(
  k: string,
): k is ConsoleEvidenceMediaSourceKind {
  return (
    k in EVIDENCE_MEDIA_SOURCE_LABELS
  );
}

/**
 * Renders a hex SHA-256 checksum as compact `aaaa…bbbb` for
 * operator display. Backend may already short-form, but we
 * idempotently truncate to keep table rendering predictable.
 */
export function shortChecksum(raw: string): string {
  if (raw.length <= 12) return raw;
  return `${raw.slice(0, 4)}…${raw.slice(-4)}`;
}

export function mapReportStatusDtoToConsole(
  dto: ReportStatusDto,
): ConsoleEvidenceReportStatus {
  switch (dto) {
    case "ready":
      return "ready";
    case "failed":
      return "failed";
    case "accepted":
    case "inProgress":
      return "generating";
    default:
      return "unknown";
  }
}

export function applyManifestToMediaRef(
  base: ConsoleEvidenceMediaRef,
  manifest: PlaybackManifestDto,
): ConsoleEvidenceMediaRef {
  const allRawSegments = (manifest.segments ?? []).flatMap(
    (entry) => entry.segments ?? [],
  );
  const segmentCount = allRawSegments.length;
  const sources = Array.from(
    new Set(
      allRawSegments
        .map((s) => s.sourceId as MediaSourceKindDto)
        .filter(isKnownSourceKind),
    ),
  );
  const segments: ConsoleEvidenceMediaSegment[] = allRawSegments
    .filter((s) => isKnownSourceKind(s.sourceId))
    .map((s) => {
      const source = s.sourceId as ConsoleEvidenceMediaSourceKind;
      return {
        segmentId: s.segmentId,
        source,
        sourceLabel: EVIDENCE_MEDIA_SOURCE_LABELS[source],
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        checksumShort: shortChecksum(s.checksum),
      };
    });
  const timeline: ConsoleEvidenceMediaTimelineEntry[] = (
    manifest.timelineMap ?? []
  )
    .filter((t) => isKnownSourceKind(t.sourceId))
    .map((t) => {
      const source = t.sourceId as ConsoleEvidenceMediaSourceKind;
      return {
        timelineFrom: t.timelineFrom,
        timelineTo: t.timelineTo,
        source,
        sourceLabel: EVIDENCE_MEDIA_SOURCE_LABELS[source],
        segmentId: t.segmentId,
      };
    });
  return {
    ...base,
    recordingId: manifest.recordingId,
    status: "finalized",
    statusLabel: EVIDENCE_MEDIA_STATUS_LABELS.finalized,
    sources: sources.length > 0 ? sources : base.sources,
    segmentCount,
    manifestExpiresAt: manifest.expiresAt,
    segments,
    timeline,
    manifestError: undefined,
  };
}

export function applyReportToReportRef(
  base: ConsoleEvidenceReportRef,
  report: ReportDto,
): ConsoleEvidenceReportRef {
  const status = mapReportStatusDtoToConsole(report.status);
  return {
    ...base,
    reportId: report.reportId,
    status,
    statusLabel: EVIDENCE_REPORT_STATUS_LABELS[status],
    generatedAt: report.generatedAt ?? "—",
    reportError: undefined,
  };
}

function explainError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Backend fetch failed.";
}

export function mapMediaRecordingStatusToConsole(
  s: MediaRecordingStatusDto,
): ConsoleEvidenceMediaRecordingStatus {
  switch (s) {
    case "active":
    case "finalized":
    case "failed":
      return s;
    default:
      return "unknown";
  }
}

export function mapExamMediaRecordingDto(
  dto: ExamMediaRecordingDto,
): ConsoleExamMediaIndexRecording {
  const status = mapMediaRecordingStatusToConsole(dto.status);
  return {
    recordingId: dto.recordingId,
    sessionId: dto.sessionId,
    evidenceType: dto.evidenceType,
    status,
    statusLabel: EVIDENCE_MEDIA_STATUS_LABELS[status],
    startedAt: dto.startedAt,
    finalizedAt: dto.finalizedAt,
    segmentCount: dto.segmentCount,
  };
}

export function mapExamMediaIndexDto(
  examId: string,
  dto: ExamMediaIndexDto,
): ConsoleExamMediaIndex {
  return {
    examId: dto.examId ?? examId,
    recordings: (dto.recordings ?? []).map(mapExamMediaRecordingDto),
  };
}

export async function liveExamMediaIndex(
  adapter: AutodromeApi,
  examId: string,
): Promise<ConsoleExamMediaIndex> {
  try {
    const result = await adapter.mediaArchive.GET(
      "/media/exams/{examId}/media",
      { params: { path: { examId } } },
    );
    const dto = result.data as ExamMediaIndexDto | undefined;
    if (!dto) {
      return {
        examId,
        recordings: [],
        indexError: "Exam media index returned no body.",
      };
    }
    return mapExamMediaIndexDto(examId, dto);
  } catch (error) {
    return {
      examId,
      recordings: [],
      indexError: explainError(error),
    };
  }
}

export async function liveEvidenceDetailLoader(
  adapter: AutodromeApi,
  evidenceId: string,
): Promise<ConsoleEvidenceDetail> {
  // Base record is mock-sourced — no canonical evidence
  // service contract yet.
  const base = consoleEvidenceDetailFor(evidenceId);

  const mediaRefs = await Promise.all(
    base.mediaRefs.map(async (ref) => {
      try {
        const result = await adapter.mediaArchive.GET(
          "/media/recordings/{recordingId}/manifest",
          {
            params: { path: { recordingId: ref.recordingId } },
          },
        );
        const manifest = result.data as PlaybackManifestDto | undefined;
        if (!manifest) {
          return {
            ...ref,
            manifestError:
              "Manifest endpoint returned no body.",
          };
        }
        return applyManifestToMediaRef(ref, manifest);
      } catch (error) {
        return {
          ...ref,
          manifestError: explainError(error),
        };
      }
    }),
  );

  const reportRefs = await Promise.all(
    base.reportRefs.map(async (ref) => {
      try {
        const result = await adapter.reportingDocument.GET(
          "/reports/{reportId}",
          {
            params: { path: { reportId: ref.reportId } },
          },
        );
        const report = result.data as ReportDto | undefined;
        if (!report) {
          return {
            ...ref,
            reportError:
              "Report endpoint returned no body.",
          };
        }
        return applyReportToReportRef(ref, report);
      } catch (error) {
        return {
          ...ref,
          reportError: explainError(error),
        };
      }
    }),
  );

  // Exam-wide media index. Only fetched when the base record has
  // a non-placeholder examId (fixture uses "—" for unmapped
  // evidence). On a placeholder examId we skip the index call
  // entirely so a 404 storm is avoided.
  const examId = base.evidence.examId;
  const examMediaIndex =
    examId && examId !== "—"
      ? await liveExamMediaIndex(adapter, examId)
      : undefined;

  return {
    ...base,
    mediaRefs,
    reportRefs,
    examMediaIndex,
  };
}
