import type { components } from "@/contracts/types/media-archive";
import type { MockScenario } from "../scenarios";

type MediaRecording = components["schemas"]["MediaRecording"];

const RECORDING_NORMAL_A: MediaRecording = {
  recordingId: "70000000-0000-4000-8000-000000000001",
  examRef: { examId: "30000000-0000-4000-8000-000000000001" },
  sources: [
    { sourceId: "cam-cabin-front", kind: "cabinFront" },
    { sourceId: "cam-exterior-front", kind: "exteriorFront" },
    { sourceId: "mic-cabin", kind: "microphone" },
  ],
  status: "finalized",
  startedAt: "2026-06-19T09:00:00Z",
  finalizedAt: "2026-06-19T09:45:00Z",
};

const RECORDING_NORMAL_B: MediaRecording = {
  recordingId: "70000000-0000-4000-8000-000000000002",
  examRef: { examId: "30000000-0000-4000-8000-000000000002" },
  sources: [
    { sourceId: "cam-cabin-side", kind: "cabinSide" },
    { sourceId: "cam-exterior-rear", kind: "exteriorRear" },
  ],
  status: "finalized",
  startedAt: "2026-06-19T10:00:00Z",
  finalizedAt: "2026-06-19T10:30:00Z",
};

const RECORDING_ACTIVE: MediaRecording = {
  recordingId: "70000000-0000-4000-8000-000000000003",
  examRef: { examId: "30000000-0000-4000-8000-000000000003" },
  sources: [
    { sourceId: "cam-cabin-front", kind: "cabinFront" },
    { sourceId: "mic-cabin", kind: "microphone" },
  ],
  status: "active",
  startedAt: "2026-06-19T10:30:00Z",
};

const RECORDING_FAILED: MediaRecording = {
  recordingId: "70000000-0000-4000-8000-000000000004",
  examRef: { examId: "30000000-0000-4000-8000-000000000004" },
  sources: [{ sourceId: "cam-exterior-front", kind: "exteriorFront" }],
  status: "failed",
  startedAt: "2026-06-19T11:00:00Z",
};

export function recordingsFor(scenario: MockScenario): MediaRecording[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [RECORDING_NORMAL_A, RECORDING_ACTIVE];
    case "violations-detected":
      return [
        RECORDING_NORMAL_A,
        RECORDING_NORMAL_B,
        RECORDING_ACTIVE,
        RECORDING_FAILED,
      ];
    case "service-degraded":
      return [RECORDING_NORMAL_A];
    case "normal":
    default:
      return [RECORDING_NORMAL_A, RECORDING_NORMAL_B];
  }
}
