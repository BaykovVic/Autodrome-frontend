import { consoleEvidenceFor } from "./consoleEvidenceFixtures";
import {
  EVIDENCE_MEDIA_STATUS_LABELS,
  EVIDENCE_REPORT_STATUS_LABELS,
  type ConsoleEvidence,
  type ConsoleEvidenceDetail,
  type ConsoleEvidenceMediaRef,
  type ConsoleEvidenceReportRef,
} from "./consoleEvidenceSnapshot";

type EvidenceLinks = {
  mediaRefs?: ConsoleEvidenceMediaRef[];
  reportRefs?: ConsoleEvidenceReportRef[];
  notes?: string;
};

const LINKS: Record<string, EvidenceLinks> = {
  "EVD-77210": {
    mediaRefs: [
      {
        recordingId: "REC-77210-A",
        status: "finalized",
        statusLabel: EVIDENCE_MEDIA_STATUS_LABELS.finalized,
        sources: ["cabinFront", "exteriorFront"],
        segmentCount: 2,
        manifestExpiresAt: "2026-06-26T18:00:00Z",
        segments: [
          {
            segmentId: "SEG-77210-A-001",
            source: "cabinFront",
            sourceLabel: "Cabin front",
            startedAt: "2026-06-19T12:10:50Z",
            endedAt: "2026-06-19T12:11:50Z",
            checksumShort: "a1f4…9c20",
          },
          {
            segmentId: "SEG-77210-A-002",
            source: "exteriorFront",
            sourceLabel: "Exterior front",
            startedAt: "2026-06-19T12:11:50Z",
            endedAt: "2026-06-19T12:12:50Z",
            checksumShort: "5b07…d11a",
          },
        ],
        timeline: [
          {
            timelineFrom: "2026-06-19T12:10:50Z",
            timelineTo: "2026-06-19T12:11:50Z",
            source: "cabinFront",
            sourceLabel: "Cabin front",
            segmentId: "SEG-77210-A-001",
          },
          {
            timelineFrom: "2026-06-19T12:11:50Z",
            timelineTo: "2026-06-19T12:12:50Z",
            source: "exteriorFront",
            sourceLabel: "Exterior front",
            segmentId: "SEG-77210-A-002",
          },
        ],
      },
    ],
    reportRefs: [
      {
        reportId: "RPT-EXM-2026-0337",
        status: "ready",
        statusLabel: EVIDENCE_REPORT_STATUS_LABELS.ready,
        generatedAt: "2026-06-19T12:18:42Z",
      },
    ],
    notes: "Telemetry envelope and manifest sealed; awaiting playback feature.",
  },
  "EVD-77211": {
    mediaRefs: [
      {
        recordingId: "REC-77211-CABIN",
        status: "finalized",
        statusLabel: EVIDENCE_MEDIA_STATUS_LABELS.finalized,
        sources: ["cabinFront", "cabinSide"],
        segmentCount: 9,
        manifestExpiresAt: "2026-06-26T18:00:00Z",
      },
      {
        recordingId: "REC-77211-EXT",
        status: "active",
        statusLabel: EVIDENCE_MEDIA_STATUS_LABELS.active,
        sources: ["exteriorFront", "exteriorRear"],
        segmentCount: 4,
        manifestExpiresAt: "2026-06-26T18:00:00Z",
        manifestError:
          "Manifest fetch returned 409 — recording is still active.",
      },
    ],
    reportRefs: [
      {
        reportId: "RPT-EXM-2026-0337",
        status: "ready",
        statusLabel: EVIDENCE_REPORT_STATUS_LABELS.ready,
        generatedAt: "2026-06-19T12:18:42Z",
      },
    ],
  },
  "EVD-77204": {
    mediaRefs: [
      {
        recordingId: "REC-77204-PHOTO",
        status: "failed",
        statusLabel: EVIDENCE_MEDIA_STATUS_LABELS.failed,
        sources: ["cabinSide"],
        segmentCount: 0,
        manifestExpiresAt: "—",
        manifestError: "Recording finalize failed: checksum mismatch.",
      },
    ],
    reportRefs: [
      {
        reportId: "RPT-EXM-2026-0334",
        status: "failed",
        statusLabel: EVIDENCE_REPORT_STATUS_LABELS.failed,
        generatedAt: "—",
        reportError: "Report generation blocked by failed media segment.",
      },
    ],
    notes: "Integrity failure — escalate to operations.",
  },
  "EVD-77205": {
    mediaRefs: [
      {
        recordingId: "REC-77205-AUDIO",
        status: "finalized",
        statusLabel: EVIDENCE_MEDIA_STATUS_LABELS.finalized,
        sources: ["microphone"],
        segmentCount: 3,
        manifestExpiresAt: "2026-06-26T18:00:00Z",
      },
    ],
    reportRefs: [
      {
        reportId: "RPT-EXM-2026-0334",
        status: "failed",
        statusLabel: EVIDENCE_REPORT_STATUS_LABELS.failed,
        generatedAt: "—",
        reportError: "Report generation blocked by failed media segment.",
      },
    ],
  },
  "EVD-77198": {
    mediaRefs: [],
    reportRefs: [
      {
        reportId: "RPT-EXM-2026-0334",
        status: "failed",
        statusLabel: EVIDENCE_REPORT_STATUS_LABELS.failed,
        generatedAt: "—",
        reportError: "Report generation blocked by failed media segment.",
      },
    ],
    notes: "Biometry-only evidence — media archive не задействован.",
  },
  "EVD-77212": {
    mediaRefs: [
      {
        recordingId: "REC-77212",
        status: "active",
        statusLabel: EVIDENCE_MEDIA_STATUS_LABELS.active,
        sources: ["cabinFront"],
        segmentCount: 2,
        manifestExpiresAt: "—",
        manifestError: "Recording is still active — manifest not yet sealed.",
      },
    ],
    reportRefs: [],
    notes: "Exam still in progress — report and manifest not ready.",
  },
};

function findEvidenceById(id: string): ConsoleEvidence | undefined {
  for (const scenario of [
    "normal",
    "exam-in-progress",
    "violations-detected",
    "service-degraded",
  ] as const) {
    const snap = consoleEvidenceFor(scenario);
    const hit = snap.evidence.find((e) => e.id === id);
    if (hit) return hit;
  }
  return undefined;
}

const NOT_FOUND_NOTE =
  "Evidence id not present in any fixture scenario.";

function notFoundDetail(id: string): ConsoleEvidenceDetail {
  return {
    evidence: {
      id,
      examId: "—",
      type: "telemetry",
      typeLabel: "—",
      captured: "—",
      size: "—",
      status: "pending",
      statusLabel: "unknown",
      sha256: "—",
      previewAvailable: false,
    },
    mediaRefs: [],
    reportRefs: [],
    notes: NOT_FOUND_NOTE,
  };
}

export function consoleEvidenceDetailFor(
  evidenceId: string,
): ConsoleEvidenceDetail {
  const evidence = findEvidenceById(evidenceId);
  if (!evidence) return notFoundDetail(evidenceId);
  const links = LINKS[evidenceId] ?? {};
  return {
    evidence,
    mediaRefs: links.mediaRefs ?? [],
    reportRefs: links.reportRefs ?? [],
    notes: links.notes,
  };
}

export const __EVIDENCE_DETAIL_FIXTURE_KEYS__ = Object.keys(LINKS);
