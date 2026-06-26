import type { MockScenario } from "@/api/mock/scenarios";

import {
  ALL_SECURITY_ROLES,
  type ConsoleSecurityActor,
  type ConsoleSecuritySnapshot,
} from "./consoleSecuritySnapshot";

const ANNA_ADMIN: ConsoleSecurityActor = {
  actorId: "20000000-0000-4000-8000-000000000001",
  actorType: "user",
  label: "Anna Petrova",
  roles: ["admin", "techAdmin"],
  permissions: [
    "user.read",
    "user.assign",
    "role.read",
    "audit.read",
    "exam.read",
  ],
};

const BORIS_OPERATOR: ConsoleSecurityActor = {
  actorId: "20000000-0000-4000-8000-000000000002",
  actorType: "user",
  label: "Boris Ivanov",
  roles: ["operator"],
  permissions: ["exam.read", "candidate.read", "evidence.read"],
};

const CLARA_DISPATCHER: ConsoleSecurityActor = {
  actorId: "20000000-0000-4000-8000-000000000003",
  actorType: "user",
  label: "Clara Mironova",
  roles: ["dispatcher"],
  permissions: ["station.read", "schedule.read", "operator.read"],
};

const DMITRY_AUDITOR: ConsoleSecurityActor = {
  actorId: "20000000-0000-4000-8000-000000000004",
  actorType: "user",
  label: "Dmitry Volkov",
  roles: ["auditor"],
  permissions: [
    "audit.read",
    "audit.export",
    "evidence.read",
    "report.read",
  ],
};

const ELENA_INSPECTOR: ConsoleSecurityActor = {
  actorId: "20000000-0000-4000-8000-000000000005",
  actorType: "user",
  label: "Elena Sokolova",
  roles: ["inspector"],
  permissions: ["exam.read", "violation.read", "evidence.read"],
};

const ALL_OPERATORS: ConsoleSecurityActor[] = [
  ANNA_ADMIN,
  BORIS_OPERATOR,
  CLARA_DISPATCHER,
  DMITRY_AUDITOR,
  ELENA_INSPECTOR,
];

const NORMAL: ConsoleSecuritySnapshot = {
  currentActor: ANNA_ADMIN,
  operators: ALL_OPERATORS,
  roles: ALL_SECURITY_ROLES,
};

const EMPTY: ConsoleSecuritySnapshot = {
  currentActor: null,
  operators: [],
  roles: ALL_SECURITY_ROLES,
  degradedNote: "No authenticated actor (auth/me returned empty).",
};

const SERVICE_DEGRADED: ConsoleSecuritySnapshot = {
  currentActor: ANNA_ADMIN,
  operators: [ANNA_ADMIN],
  roles: ALL_SECURITY_ROLES,
  degradedNote:
    "Identity service is degraded — only the current actor is reachable.",
};

export function consoleSecurityFor(
  scenario: MockScenario,
): ConsoleSecuritySnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    case "violations-detected":
    case "exam-in-progress":
    default:
      return NORMAL;
  }
}

export const __SECURITY_FIXTURE_KEYS__ = ALL_OPERATORS.map(
  (a) => a.actorId,
);
