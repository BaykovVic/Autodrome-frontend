import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleCandidate,
  ConsoleCandidatesSnapshot,
} from "./consoleRegistrySnapshot";

/**
 * Per spec: all nine enrollment states must be represented across
 * scenario fixtures. The `NORMAL` scenario combines `NORMAL_CANDIDATES`
 * (eight candidates, enrollment states 1–8) with
 * `SESSION_EXPIRED_CANDIDATE` (the ninth — `session-expired`), for a
 * total of nine candidates with one-to-one state coverage. Scenarios
 * like `violations-detected` and `exam-in-progress` derive from
 * `NORMAL` and adjust eligibility/labels without losing state
 * coverage.
 */
const NORMAL_CANDIDATES: ConsoleCandidate[] = [
  {
    id: "CND-1042",
    name: "A. Nikitin",
    category: "Cat B",
    registration: { state: "registered", label: "registered" },
    maskedDob: "**.**.1991",
    document: "DL-77-014562",
    eligibility: { state: "approved", label: "approved" },
    enrollment: {
      state: "enrolled",
      label: "enrolled",
      templateStatus: "tpl-7 · current",
      sourceDevice: "CAM-A2-01",
      lastEnrollment: "today 09:30",
    },
  },
  {
    id: "CND-1043",
    name: "M. Volkova",
    category: "Cat B",
    registration: { state: "registered", label: "registered" },
    maskedDob: "**.**.1995",
    document: "DL-77-019811",
    eligibility: { state: "approved", label: "approved" },
    enrollment: {
      state: "capturing",
      label: "capturing",
      templateStatus: "session live",
      sourceDevice: "CAM-A2-02",
      lastEnrollment: "in progress",
    },
  },
  {
    id: "CND-1044",
    name: "S. Belov",
    category: "Cat A",
    registration: { state: "registered", label: "registered" },
    maskedDob: "**.**.1990",
    document: "DL-77-020118",
    eligibility: { state: "approved", label: "approved" },
    enrollment: {
      state: "command-sent",
      label: "command sent",
      templateStatus: "—",
      sourceDevice: "CAM-A2-01",
      lastEnrollment: "queued · 11:42",
    },
  },
  {
    id: "CND-1045",
    name: "I. Pavlov",
    category: "Cat C",
    registration: { state: "registered", label: "registered" },
    maskedDob: "**.**.1988",
    document: "DL-77-031044",
    eligibility: { state: "approved", label: "approved" },
    enrollment: {
      state: "ready-to-enroll",
      label: "ready to enroll",
      templateStatus: "—",
      sourceDevice: "CAM-A2-01",
      lastEnrollment: "—",
    },
  },
  {
    id: "CND-1046",
    name: "K. Lazareva",
    category: "Cat B",
    registration: { state: "incomplete", label: "incomplete" },
    maskedDob: "**.**.1993",
    document: "DL-77-008822",
    eligibility: { state: "pending", label: "pending decision" },
    enrollment: {
      state: "not-enrolled",
      label: "not enrolled",
      templateStatus: "—",
      sourceDevice: "—",
      lastEnrollment: "—",
    },
  },
  {
    id: "CND-1047",
    name: "D. Sokolov",
    category: "Cat B",
    registration: { state: "pending", label: "pending" },
    maskedDob: "**.**.1992",
    document: "DL-77-105410",
    eligibility: { state: "denied", label: "denied" },
    enrollment: {
      state: "quality-failed",
      label: "quality failed",
      templateStatus: "rejected · low light",
      sourceDevice: "CAM-A2-02",
      lastEnrollment: "yesterday 17:14",
    },
  },
  {
    id: "CND-1048",
    name: "E. Orlov",
    category: "Cat A",
    registration: { state: "registered", label: "registered" },
    maskedDob: "**.**.1989",
    document: "DL-77-211044",
    eligibility: { state: "approved", label: "approved" },
    enrollment: {
      state: "needs-retry",
      label: "needs retry",
      templateStatus: "1/3 attempts used",
      sourceDevice: "CAM-A2-01",
      lastEnrollment: "today 08:14",
    },
  },
  {
    id: "CND-1049",
    name: "N. Petrova",
    category: "Cat B",
    registration: { state: "registered", label: "registered" },
    maskedDob: "**.**.1997",
    document: "DL-77-307712",
    eligibility: { state: "approved", label: "approved" },
    enrollment: {
      state: "device-unavailable",
      label: "device unavailable",
      templateStatus: "—",
      sourceDevice: "CAM-A2-03 · offline",
      lastEnrollment: "—",
    },
  },
];

const SESSION_EXPIRED_CANDIDATE: ConsoleCandidate = {
  id: "CND-1050",
  name: "R. Aksyonov",
  category: "Cat C",
  registration: { state: "incomplete", label: "incomplete" },
  maskedDob: "**.**.1986",
  document: "DL-77-410988",
  eligibility: { state: "expired", label: "expired" },
  enrollment: {
    state: "session-expired",
    label: "session expired",
    templateStatus: "—",
    sourceDevice: "CAM-A2-02",
    lastEnrollment: "2d ago",
  },
};

function awaitingEnrollmentCount(candidates: ConsoleCandidate[]): number {
  return candidates.filter(
    (c) =>
      c.enrollment.state !== "enrolled",
  ).length;
}

const NORMAL_FULL: ConsoleCandidate[] = [
  ...NORMAL_CANDIDATES,
  SESSION_EXPIRED_CANDIDATE,
];

const NORMAL: ConsoleCandidatesSnapshot = {
  totals: {
    total: NORMAL_FULL.length,
    awaitingEnrollment: awaitingEnrollmentCount(NORMAL_FULL),
  },
  candidates: NORMAL_FULL,
};

const EMPTY: ConsoleCandidatesSnapshot = {
  totals: { total: 0, awaitingEnrollment: 0 },
  candidates: [],
};

const VIOLATIONS_DETECTED: ConsoleCandidatesSnapshot = {
  ...NORMAL,
  candidates: NORMAL_FULL.map((c) =>
    c.id === "CND-1044"
      ? {
          ...c,
          enrollment: {
            ...c.enrollment,
            state: "quality-failed",
            label: "quality failed · review",
            templateStatus: "rejected · motion",
          },
        }
      : c,
  ),
};

const EXAM_IN_PROGRESS: ConsoleCandidatesSnapshot = {
  ...NORMAL,
  candidates: NORMAL_FULL.map((c) =>
    c.id === "CND-1042"
      ? {
          ...c,
          enrollment: {
            ...c.enrollment,
            label: "enrolled · in exam",
            lastEnrollment: "today 09:30 (linked to EXM-0118)",
          },
        }
      : c,
  ),
};

const SERVICE_DEGRADED: ConsoleCandidatesSnapshot = {
  ...NORMAL,
  candidates: NORMAL_FULL.map((c) =>
    c.id === "CND-1049"
      ? {
          ...c,
          enrollment: {
            ...c.enrollment,
            label: "device unavailable · all cams",
            sourceDevice: "no available device",
          },
        }
      : c,
  ),
};

export function consoleCandidatesFor(
  scenario: MockScenario,
): ConsoleCandidatesSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "violations-detected":
      return VIOLATIONS_DETECTED;
    case "exam-in-progress":
      return EXAM_IN_PROGRESS;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    default:
      return NORMAL;
  }
}
