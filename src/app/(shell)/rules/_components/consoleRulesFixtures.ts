import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleRule,
  ConsoleRulesSnapshot,
} from "./consoleRulesSnapshot";

const RULE_014: ConsoleRule = {
  id: "RULE-014",
  name: "City driving · 2026 baseline",
  version: "v6",
  status: "published",
  statusLabel: "published",
  updated: "2026-06-12",
  conditionPreview: [
    "IF score < threshold",
    "  AND violation.severity == CRITICAL",
    "  OR  violation.count > 3",
    "THEN result = FAIL",
  ],
  history: [
    {
      id: "v6",
      version: "v6",
      state: "published",
      stateLabel: "current",
      updated: "2026-06-12",
    },
    {
      id: "v5",
      version: "v5",
      state: "archived",
      stateLabel: "archived",
      updated: "2026-02-11",
    },
    {
      id: "v4",
      version: "v4",
      state: "archived",
      stateLabel: "archived",
      updated: "2025-11-04",
    },
  ],
};

const RULE_013: ConsoleRule = {
  id: "RULE-013",
  name: "Slalom · cone scoring",
  version: "v3",
  status: "published",
  statusLabel: "published",
  updated: "2026-05-19",
  conditionPreview: [
    "IF cones_hit > 0",
    "  AND course == slalom",
    "THEN penalty = cones_hit * 3",
  ],
  history: [
    {
      id: "v3",
      version: "v3",
      state: "published",
      stateLabel: "current",
      updated: "2026-05-19",
    },
    {
      id: "v2",
      version: "v2",
      state: "archived",
      stateLabel: "archived",
      updated: "2026-01-22",
    },
  ],
};

const RULE_012: ConsoleRule = {
  id: "RULE-012",
  name: "Parking · alignment",
  version: "v2",
  status: "draft",
  statusLabel: "draft",
  updated: "2026-06-18",
  conditionPreview: [
    "IF distance_to_curb > 0.30m",
    "  OR angle_offset > 5deg",
    "THEN penalty = 2",
  ],
  history: [
    {
      id: "v2",
      version: "v2",
      state: "draft",
      stateLabel: "current draft",
      updated: "2026-06-18",
    },
    {
      id: "v1",
      version: "v1",
      state: "archived",
      stateLabel: "archived",
      updated: "2025-09-30",
    },
  ],
};

const RULE_011: ConsoleRule = {
  id: "RULE-011",
  name: "Basic skills · baseline",
  version: "v4",
  status: "published",
  statusLabel: "published",
  updated: "2026-03-09",
  conditionPreview: [
    "IF stop_line_crossed",
    "  OR mirror_check_missed",
    "THEN penalty = 1",
  ],
  history: [
    {
      id: "v4",
      version: "v4",
      state: "published",
      stateLabel: "current",
      updated: "2026-03-09",
    },
    {
      id: "v3",
      version: "v3",
      state: "archived",
      stateLabel: "archived",
      updated: "2025-08-12",
    },
  ],
};

const ALL = [RULE_014, RULE_013, RULE_012, RULE_011];

const NORMAL: ConsoleRulesSnapshot = {
  totals: {
    rules: ALL.length,
    drafts: ALL.filter((r) => r.status === "draft").length,
    published: ALL.filter((r) => r.status === "published").length,
  },
  rules: ALL,
};

const VIOLATIONS_DETECTED: ConsoleRulesSnapshot = {
  ...NORMAL,
  rules: ALL.map((r) =>
    r.id === "RULE-014"
      ? { ...r, statusLabel: "published · review" }
      : r,
  ),
};

const SERVICE_DEGRADED: ConsoleRulesSnapshot = NORMAL;

const EXAM_IN_PROGRESS_SCENARIO: ConsoleRulesSnapshot = NORMAL;

const EMPTY: ConsoleRulesSnapshot = {
  totals: { rules: 0, drafts: 0, published: 0 },
  rules: [],
};

export function consoleRulesFor(
  scenario: MockScenario,
): ConsoleRulesSnapshot {
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
