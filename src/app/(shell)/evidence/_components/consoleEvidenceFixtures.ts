import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleEvidence,
  ConsoleEvidenceSnapshot,
} from "./consoleEvidenceSnapshot";

const EVD_TELEMETRY: ConsoleEvidence = {
  id: "EVD-77210",
  examId: "EXM-2026-0337",
  type: "telemetry",
  typeLabel: "telemetry",
  captured: "2026-06-19 12:11:03",
  size: "4.2 MB",
  status: "sealed",
  statusLabel: "sealed",
  sha256: "a1f4…9c20",
  previewAvailable: false,
};

const EVD_VIDEO_CABIN: ConsoleEvidence = {
  id: "EVD-77211",
  examId: "EXM-2026-0337",
  type: "video",
  typeLabel: "video",
  captured: "2026-06-19 12:10:58",
  size: "182 MB",
  status: "sealed",
  statusLabel: "sealed",
  sha256: "5b07…d11a",
  previewAvailable: false,
};

const EVD_PHOTO: ConsoleEvidence = {
  id: "EVD-77204",
  examId: "EXM-2026-0334",
  type: "photo",
  typeLabel: "photo",
  captured: "2026-06-19 10:51:30",
  size: "3.1 MB",
  status: "failed",
  statusLabel: "integrity failed",
  sha256: "0c19…ff42",
  previewAvailable: false,
};

const EVD_AUDIO: ConsoleEvidence = {
  id: "EVD-77205",
  examId: "EXM-2026-0334",
  type: "audio",
  typeLabel: "audio",
  captured: "2026-06-19 10:50:11",
  size: "11.8 MB",
  status: "sealed",
  statusLabel: "sealed",
  sha256: "8f23…91bc",
  previewAvailable: false,
};

const EVD_BIOMETRY: ConsoleEvidence = {
  id: "EVD-77198",
  examId: "EXM-2026-0334",
  type: "biometry",
  typeLabel: "biometry",
  captured: "2026-06-19 10:40:02",
  size: "112 KB",
  status: "sealed",
  statusLabel: "sealed",
  sha256: "44de…7720",
  previewAvailable: false,
};

const EVD_PENDING: ConsoleEvidence = {
  id: "EVD-77212",
  examId: "EXM-2026-0337",
  type: "video",
  typeLabel: "video",
  captured: "2026-06-19 12:13:21",
  size: "—",
  status: "pending",
  statusLabel: "sealing",
  sha256: "—",
  previewAvailable: false,
};

const BASE: ConsoleEvidence[] = [
  EVD_TELEMETRY,
  EVD_VIDEO_CABIN,
  EVD_PHOTO,
  EVD_AUDIO,
  EVD_BIOMETRY,
];

const NORMAL: ConsoleEvidenceSnapshot = {
  totals: {
    evidence: BASE.length,
    sealed: BASE.filter((e) => e.status === "sealed").length,
    failed: BASE.filter((e) => e.status === "failed").length,
  },
  degraded: false,
  evidence: BASE,
};

const VIOLATIONS_DETECTED: ConsoleEvidenceSnapshot = {
  ...NORMAL,
  evidence: BASE.map((e) =>
    e.id === EVD_TELEMETRY.id
      ? { ...e, statusLabel: "sealed · review pending" }
      : e,
  ),
};

const EXAM_IN_PROGRESS_SCENARIO: ConsoleEvidenceSnapshot = {
  totals: {
    evidence: BASE.length + 1,
    sealed: BASE.filter((e) => e.status === "sealed").length,
    failed: BASE.filter((e) => e.status === "failed").length,
  },
  degraded: false,
  evidence: [EVD_PENDING, ...BASE],
};

const SERVICE_DEGRADED: ConsoleEvidenceSnapshot = {
  totals: {
    evidence: 2,
    sealed: 1,
    failed: 0,
  },
  degraded: true,
  evidence: [EVD_TELEMETRY, EVD_PENDING],
};

const EMPTY: ConsoleEvidenceSnapshot = {
  totals: { evidence: 0, sealed: 0, failed: 0 },
  degraded: false,
  evidence: [],
};

export function consoleEvidenceFor(
  scenario: MockScenario,
): ConsoleEvidenceSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "violations-detected":
      return VIOLATIONS_DETECTED;
    case "exam-in-progress":
      return EXAM_IN_PROGRESS_SCENARIO;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    default:
      return NORMAL;
  }
}
