import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleViolation,
  ConsoleViolationsSnapshot,
} from "./consoleViolationsSnapshot";

const VIO_CORE: ConsoleViolation[] = [
  {
    id: "vio-101",
    code: "VIO-101",
    name: "Stop sign ignored",
    severity: "critical",
    severityLabel: "critical",
    penalty: "5 pt",
    status: "active",
    statusLabel: "active",
    ruleId: "RULE-014",
    requiredEvidence: ["telemetry", "video"],
  },
  {
    id: "vio-102",
    code: "VIO-102",
    name: "Lane drift",
    severity: "minor",
    severityLabel: "minor",
    penalty: "1 pt",
    status: "active",
    statusLabel: "active",
    ruleId: "RULE-014",
    requiredEvidence: ["telemetry"],
  },
  {
    id: "vio-103",
    code: "VIO-103",
    name: "Stop line crossed",
    severity: "major",
    severityLabel: "major",
    penalty: "3 pt",
    status: "active",
    statusLabel: "active",
    ruleId: "RULE-014",
    requiredEvidence: ["telemetry", "video"],
  },
  {
    id: "vio-104",
    code: "VIO-104",
    name: "Mirror check missed",
    severity: "minor",
    severityLabel: "minor",
    penalty: "1 pt",
    status: "active",
    statusLabel: "active",
    ruleId: "RULE-014",
    requiredEvidence: ["video"],
  },
  {
    id: "vio-105",
    code: "VIO-105",
    name: "Cone hit",
    severity: "major",
    severityLabel: "major",
    penalty: "3 pt",
    status: "active",
    statusLabel: "active",
    ruleId: "RULE-013",
    requiredEvidence: ["telemetry", "video"],
  },
  {
    id: "vio-106",
    code: "VIO-106",
    name: "Reverse out of bounds",
    severity: "major",
    severityLabel: "major",
    penalty: "3 pt",
    status: "deprecated",
    statusLabel: "deprecated",
    ruleId: "RULE-012",
    requiredEvidence: ["telemetry"],
  },
];

const NORMAL: ConsoleViolationsSnapshot = {
  activeRule: { id: "RULE-014", version: "v6" },
  totals: {
    violations: VIO_CORE.length,
    active: VIO_CORE.filter((v) => v.status === "active").length,
    deprecated: VIO_CORE.filter((v) => v.status === "deprecated").length,
  },
  violations: VIO_CORE,
};

const VIOLATIONS_DETECTED: ConsoleViolationsSnapshot = {
  ...NORMAL,
  violations: VIO_CORE.map((v) =>
    v.id === "vio-101"
      ? { ...v, severityLabel: "critical · flagged" }
      : v,
  ),
};

const SERVICE_DEGRADED: ConsoleViolationsSnapshot = NORMAL;

const EXAM_IN_PROGRESS_SCENARIO: ConsoleViolationsSnapshot = NORMAL;

const EMPTY: ConsoleViolationsSnapshot = {
  activeRule: { id: "—", version: "—" },
  totals: { violations: 0, active: 0, deprecated: 0 },
  violations: [],
};

export function consoleViolationsFor(
  scenario: MockScenario,
): ConsoleViolationsSnapshot {
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
