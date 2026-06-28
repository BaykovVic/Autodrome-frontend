import {
  evidenceLinkHref,
  evidenceToneForSeverity,
  EVIDENCE_SOURCE_LABELS,
  normalizeEvidenceSource,
  type ConsoleEvidenceTimelineEntry,
  type ConsoleEvidenceTimelineSnapshot,
} from "./consoleExamEvidenceTimeline";

type FixtureEntry = {
  sourceType: string;
  refKind: string;
  refId?: string;
  occurredAt: string;
  label?: string;
  severity?: string;
};

const FIXTURE_ENTRIES: readonly FixtureEntry[] = [
  {
    sourceType: "lifecycle",
    refKind: "examCreated",
    occurredAt: "2026-06-26T10:00:00Z",
    label: "Exam created",
    severity: "info",
  },
  {
    sourceType: "lifecycle",
    refKind: "examStarted",
    occurredAt: "2026-06-26T10:05:00Z",
    label: "Exam started",
    severity: "info",
  },
  {
    sourceType: "telemetry",
    refKind: "telemetrySample",
    refId: "TLM-04A1",
    occurredAt: "2026-06-26T10:06:12Z",
    label: "Telemetry sample registered",
    severity: "info",
  },
  {
    sourceType: "media",
    refKind: "media-segment",
    refId: "MED-0001",
    occurredAt: "2026-06-26T10:07:30Z",
    label: "Front camera segment attached",
    severity: "info",
  },
  {
    sourceType: "biometry",
    refKind: "matchProbe",
    refId: "BIO-9F",
    occurredAt: "2026-06-26T10:07:45Z",
    label: "Biometry probe captured",
    severity: "info",
  },
  {
    sourceType: "violation",
    refKind: "violationOccurrence",
    refId: "VIO-7A",
    occurredAt: "2026-06-26T10:12:18Z",
    label: "Stop line crossed",
    severity: "warning",
  },
  {
    sourceType: "audio",
    refKind: "audio-trigger",
    refId: "AUD-3C",
    occurredAt: "2026-06-26T10:12:25Z",
    label: "Audio cue: stop-line warning",
    severity: "warning",
  },
  {
    sourceType: "violation",
    refKind: "violationOccurrence",
    refId: "VIO-7B",
    occurredAt: "2026-06-26T10:18:02Z",
    label: "Wrong-lane drift",
    severity: "critical",
  },
  {
    sourceType: "media",
    refKind: "media-segment",
    refId: "MED-0002",
    occurredAt: "2026-06-26T10:18:03Z",
    label: "Cabin camera segment attached",
  },
  {
    sourceType: "lifecycle",
    refKind: "examFinished",
    occurredAt: "2026-06-26T10:25:00Z",
    label: "Exam finished",
    severity: "info",
  },
];

function entryFromFixture(f: FixtureEntry): ConsoleEvidenceTimelineEntry {
  const source = normalizeEvidenceSource(f.sourceType);
  return {
    key: `${f.sourceType}:${f.refKind}:${f.refId ?? f.occurredAt}`,
    sourceType: f.sourceType,
    source,
    sourceLabel: EVIDENCE_SOURCE_LABELS[source],
    refKind: f.refKind,
    refId: f.refId,
    occurredAt: f.occurredAt,
    label: f.label ?? `${f.refKind} (${f.sourceType})`,
    severity: f.severity,
    tone: evidenceToneForSeverity(f.severity),
    linkHref: evidenceLinkHref(f.refKind, f.refId),
  };
}

export function consoleExamEvidenceTimelineFor(
  examId: string,
): ConsoleEvidenceTimelineSnapshot {
  return {
    examId,
    entries: FIXTURE_ENTRIES.map(entryFromFixture),
  };
}

export function consoleExamEvidenceTimelineEmpty(
  examId: string,
): ConsoleEvidenceTimelineSnapshot {
  return { examId, entries: [] };
}
