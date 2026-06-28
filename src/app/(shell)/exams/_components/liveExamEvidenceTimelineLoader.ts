/**
 * Live exam evidence-timeline loader.
 *
 * Wires `GET /exams/{examId}/evidence-timeline` (single composed
 * read across lifecycle, violation, telemetry, media, biometry, and
 * audio-trigger sources) to the operator-facing view model. The UI
 * must not depend on individual neighbour services; this loader is
 * the only allowed entry point.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/exam";

import {
  evidenceLinkHref,
  evidenceToneForSeverity,
  EVIDENCE_SOURCE_LABELS,
  normalizeEvidenceSource,
  type ConsoleEvidenceTimelineEntry,
  type ConsoleEvidenceTimelineSnapshot,
} from "./consoleExamEvidenceTimeline";

type EvidenceTimelineEntryDto =
  components["schemas"]["ExamEvidenceTimelineEntry"];
type EvidenceTimelinePageDto =
  components["schemas"]["ExamEvidenceTimelinePage"];

export type LiveExamEvidenceTimelineQuery = {
  pageSize?: number;
  pageToken?: string;
};

export function mapEvidenceTimelineEntry(
  dto: EvidenceTimelineEntryDto,
): ConsoleEvidenceTimelineEntry {
  const source = normalizeEvidenceSource(dto.sourceType);
  return {
    key: `${dto.sourceType}:${dto.refKind}:${dto.refId ?? dto.occurredAt}`,
    sourceType: dto.sourceType,
    source,
    sourceLabel: EVIDENCE_SOURCE_LABELS[source],
    refKind: dto.refKind,
    refId: dto.refId,
    occurredAt: dto.occurredAt,
    label: dto.label ?? `${dto.refKind} (${dto.sourceType})`,
    severity: dto.severity,
    tone: evidenceToneForSeverity(dto.severity),
    linkHref: evidenceLinkHref(dto.refKind, dto.refId),
  };
}

export async function liveExamEvidenceTimeline(
  adapter: AutodromeApi,
  examId: string,
  query: LiveExamEvidenceTimelineQuery = {},
): Promise<ConsoleEvidenceTimelineSnapshot> {
  const result = await adapter.exam.GET(
    "/exams/{examId}/evidence-timeline",
    {
      params: {
        path: { examId },
        query: {
          ...(query.pageSize !== undefined
            ? { pageSize: query.pageSize }
            : {}),
          ...(query.pageToken !== undefined
            ? { pageToken: query.pageToken }
            : {}),
        },
      },
    },
  );
  const page = result.data as EvidenceTimelinePageDto | undefined;
  if (!page) {
    throw new Error(
      "exam-service returned an empty body for evidence-timeline",
    );
  }
  return {
    examId,
    entries: (page.items ?? []).map(mapEvidenceTimelineEntry),
    nextPageToken: page.nextPageToken,
  };
}
