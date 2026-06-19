import type { components } from "@/contracts/types/violation-rule";
import type { MockScenario } from "../scenarios";

type Violation = components["schemas"]["Violation"];

const NOW = "2026-06-19T10:00:00Z";

const STOP_LINE: Violation = {
  violationId: "50000000-0000-4000-8000-000000000001",
  code: "STOP_LINE_CROSSED",
  title: "Stop line crossed",
  severity: "medium",
  createdAt: NOW,
};

const SPEED_LIMIT: Violation = {
  violationId: "50000000-0000-4000-8000-000000000002",
  code: "SPEED_LIMIT_EXCEEDED",
  title: "Speed limit exceeded",
  severity: "high",
  createdAt: NOW,
};

const SEATBELT: Violation = {
  violationId: "50000000-0000-4000-8000-000000000003",
  code: "SEATBELT_MISSING",
  title: "Seatbelt not fastened",
  severity: "critical",
  createdAt: NOW,
};

export function violationsFor(scenario: MockScenario): Violation[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [STOP_LINE, SPEED_LIMIT];
    case "violations-detected":
      return [STOP_LINE, SPEED_LIMIT, SEATBELT];
    case "service-degraded":
      return [STOP_LINE];
    case "normal":
    default:
      return [STOP_LINE, SPEED_LIMIT];
  }
}
