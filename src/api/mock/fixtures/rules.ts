import type { components } from "@/contracts/types/violation-rule";
import type { MockScenario } from "../scenarios";

type RuleDefinition = components["schemas"]["RuleDefinition"];

const NOW = "2026-06-19T10:00:00Z";

const STOP_LINE_RULE: RuleDefinition = {
  ruleId: "60000000-0000-4000-8000-000000000001",
  violationRef: {
    violationId: "50000000-0000-4000-8000-000000000001",
  },
  title: "Stop line — published baseline",
  ruleVersion: 2,
  status: "published",
  publishedAt: NOW,
  createdAt: NOW,
};

const SPEED_LIMIT_RULE: RuleDefinition = {
  ruleId: "60000000-0000-4000-8000-000000000002",
  violationRef: {
    violationId: "50000000-0000-4000-8000-000000000002",
  },
  title: "Speed limit — published baseline",
  ruleVersion: 1,
  status: "published",
  publishedAt: NOW,
  createdAt: NOW,
};

const SEATBELT_RULE_DRAFT: RuleDefinition = {
  ruleId: "60000000-0000-4000-8000-000000000003",
  violationRef: {
    violationId: "50000000-0000-4000-8000-000000000003",
  },
  title: "Seatbelt — draft",
  ruleVersion: 1,
  status: "draft",
  createdAt: NOW,
};

export function rulesFor(scenario: MockScenario): RuleDefinition[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [STOP_LINE_RULE, SPEED_LIMIT_RULE];
    case "violations-detected":
      return [STOP_LINE_RULE, SPEED_LIMIT_RULE, SEATBELT_RULE_DRAFT];
    case "service-degraded":
      return [STOP_LINE_RULE];
    case "normal":
    default:
      return [STOP_LINE_RULE, SPEED_LIMIT_RULE];
  }
}
