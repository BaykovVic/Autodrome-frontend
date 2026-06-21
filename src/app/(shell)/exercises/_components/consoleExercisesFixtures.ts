import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleExercise,
  ConsoleExerciseGroup,
  ConsoleExercisesSnapshot,
} from "./consoleExercisesSnapshot";

const GROUPS: ConsoleExerciseGroup[] = [
  { id: "grp-basic", name: "Basic skills", count: 4 },
  { id: "grp-slalom", name: "Slalom", count: 3 },
  { id: "grp-parking", name: "Parking", count: 3 },
  { id: "grp-city", name: "City", count: 2 },
];

const EX_BASIC: ConsoleExercise[] = [
  {
    id: "ex-101",
    code: "EX-101",
    name: "Vehicle start & stop",
    groupId: "grp-basic",
    version: "v3",
    difficulty: "Beginner",
    maxDuration: "03:00",
    linkedRuleId: "RULE-011",
    status: "published",
    statusLabel: "published",
  },
  {
    id: "ex-102",
    code: "EX-102",
    name: "Straight-line drive",
    groupId: "grp-basic",
    version: "v2",
    difficulty: "Beginner",
    maxDuration: "04:00",
    linkedRuleId: "RULE-011",
    status: "published",
    statusLabel: "published",
  },
  {
    id: "ex-103",
    code: "EX-103",
    name: "Mirror & blind-spot check",
    groupId: "grp-basic",
    version: "v1",
    difficulty: "Beginner",
    maxDuration: "02:30",
    linkedRuleId: "RULE-011",
    status: "draft",
    statusLabel: "draft",
  },
  {
    id: "ex-104",
    code: "EX-104",
    name: "Reverse straight",
    groupId: "grp-basic",
    version: "v4",
    difficulty: "Beginner",
    maxDuration: "03:30",
    linkedRuleId: "RULE-011",
    status: "published",
    statusLabel: "published",
  },
];

const EX_SLALOM: ConsoleExercise[] = [
  {
    id: "ex-201",
    code: "EX-201",
    name: "Slalom-A · 3 cones",
    groupId: "grp-slalom",
    version: "v2",
    difficulty: "Intermediate",
    maxDuration: "05:00",
    linkedRuleId: "RULE-013",
    status: "published",
    statusLabel: "published",
  },
  {
    id: "ex-202",
    code: "EX-202",
    name: "Slalom-B · 5 cones",
    groupId: "grp-slalom",
    version: "v3",
    difficulty: "Advanced",
    maxDuration: "06:00",
    linkedRuleId: "RULE-013",
    status: "published",
    statusLabel: "published",
  },
  {
    id: "ex-203",
    code: "EX-203",
    name: "Slalom-C · reverse",
    groupId: "grp-slalom",
    version: "v1",
    difficulty: "Advanced",
    maxDuration: "07:00",
    linkedRuleId: "RULE-013",
    status: "draft",
    statusLabel: "draft",
  },
];

const EX_PARKING: ConsoleExercise[] = [
  {
    id: "ex-301",
    code: "EX-301",
    name: "Parallel parking",
    groupId: "grp-parking",
    version: "v2",
    difficulty: "Intermediate",
    maxDuration: "06:00",
    linkedRuleId: "RULE-012",
    status: "published",
    statusLabel: "published",
  },
  {
    id: "ex-302",
    code: "EX-302",
    name: "Perpendicular parking",
    groupId: "grp-parking",
    version: "v2",
    difficulty: "Intermediate",
    maxDuration: "06:00",
    linkedRuleId: "RULE-012",
    status: "published",
    statusLabel: "published",
  },
  {
    id: "ex-303",
    code: "EX-303",
    name: "Garage entry",
    groupId: "grp-parking",
    version: "v1",
    difficulty: "Intermediate",
    maxDuration: "05:30",
    linkedRuleId: "RULE-012",
    status: "retired",
    statusLabel: "retired",
  },
];

const EX_CITY: ConsoleExercise[] = [
  {
    id: "ex-401",
    code: "EX-401",
    name: "City-A · intersections",
    groupId: "grp-city",
    version: "v5",
    difficulty: "Advanced",
    maxDuration: "12:00",
    linkedRuleId: "RULE-014",
    status: "published",
    statusLabel: "published",
  },
  {
    id: "ex-402",
    code: "EX-402",
    name: "City-B · roundabouts",
    groupId: "grp-city",
    version: "v3",
    difficulty: "Advanced",
    maxDuration: "10:00",
    linkedRuleId: "RULE-014",
    status: "published",
    statusLabel: "published",
  },
];

const ALL_EX = [...EX_BASIC, ...EX_SLALOM, ...EX_PARKING, ...EX_CITY];

const NORMAL: ConsoleExercisesSnapshot = {
  totals: {
    groups: GROUPS.length,
    exercises: ALL_EX.length,
    drafts: ALL_EX.filter((e) => e.status === "draft").length,
  },
  groups: GROUPS,
  exercises: ALL_EX,
};

const VIOLATIONS_DETECTED: ConsoleExercisesSnapshot = {
  ...NORMAL,
  totals: {
    ...NORMAL.totals,
    drafts: NORMAL.totals.drafts + 1,
  },
  exercises: NORMAL.exercises.map((e) =>
    e.id === "ex-202"
      ? { ...e, status: "draft", statusLabel: "draft · review" }
      : e,
  ),
};

const SERVICE_DEGRADED: ConsoleExercisesSnapshot = NORMAL;

const EXAM_IN_PROGRESS_SCENARIO: ConsoleExercisesSnapshot = NORMAL;

const EMPTY: ConsoleExercisesSnapshot = {
  totals: { groups: 0, exercises: 0, drafts: 0 },
  groups: [],
  exercises: [],
};

export function consoleExercisesFor(
  scenario: MockScenario,
): ConsoleExercisesSnapshot {
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
