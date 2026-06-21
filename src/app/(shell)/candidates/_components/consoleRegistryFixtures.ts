import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleCandidate,
  ConsoleCandidatesSnapshot,
} from "./consoleRegistrySnapshot";

const NORMAL_CANDIDATES: ConsoleCandidate[] = [
  {
    id: "CND-1042",
    name: "A. Nikitin",
    category: "Cat B",
    registration: { state: "registered", label: "registered" },
    face: { state: "verified", label: "verified", confidence: "0.97" },
    examCount: 3,
    dateOfBirth: "1991-04-08",
    phone: "+7 999 014 22 41",
    lastActivity: "today 11:42",
  },
  {
    id: "CND-1043",
    name: "M. Volkova",
    category: "Cat B",
    registration: { state: "registered", label: "registered" },
    face: { state: "verified", label: "verified", confidence: "0.94" },
    examCount: 2,
    dateOfBirth: "1995-09-21",
    phone: "+7 999 045 11 12",
    lastActivity: "today 10:08",
  },
  {
    id: "CND-1044",
    name: "S. Belov",
    category: "Cat A",
    registration: { state: "registered", label: "registered" },
    face: { state: "pending", label: "pending", confidence: "0.61" },
    examCount: 1,
    dateOfBirth: "1990-02-14",
    phone: "+7 999 002 88 30",
    lastActivity: "yesterday 17:14",
  },
  {
    id: "CND-1045",
    name: "I. Pavlov",
    category: "Cat C",
    registration: { state: "pending", label: "pending" },
    face: { state: "unverified", label: "unverified" },
    examCount: 0,
    dateOfBirth: "1988-12-03",
    phone: "+7 999 070 55 18",
    lastActivity: "—",
  },
  {
    id: "CND-1046",
    name: "K. Lazareva",
    category: "Cat B",
    registration: { state: "registered", label: "registered" },
    face: { state: "verified", label: "verified", confidence: "0.99" },
    examCount: 5,
    dateOfBirth: "1993-06-30",
    phone: "+7 999 211 64 09",
    lastActivity: "today 09:30",
  },
  {
    id: "CND-1047",
    name: "D. Sokolov",
    category: "Cat B",
    registration: { state: "incomplete", label: "incomplete" },
    face: { state: "unverified", label: "unverified" },
    examCount: 0,
    dateOfBirth: "1992-08-17",
    phone: "+7 999 311 12 88",
    lastActivity: "3d ago",
  },
  {
    id: "CND-1048",
    name: "E. Orlov",
    category: "Cat A",
    registration: { state: "registered", label: "registered" },
    face: { state: "pending", label: "pending", confidence: "0.72" },
    examCount: 1,
    dateOfBirth: "1989-11-09",
    phone: "+7 999 411 77 55",
    lastActivity: "today 08:14",
  },
];

function awaitingFaceCount(candidates: ConsoleCandidate[]): number {
  return candidates.filter(
    (c) => c.face.state === "pending" || c.face.state === "unverified",
  ).length;
}

const NORMAL: ConsoleCandidatesSnapshot = {
  totals: {
    total: NORMAL_CANDIDATES.length,
    awaitingFaceVerification: awaitingFaceCount(NORMAL_CANDIDATES),
  },
  candidates: NORMAL_CANDIDATES,
};

const EMPTY: ConsoleCandidatesSnapshot = {
  totals: { total: 0, awaitingFaceVerification: 0 },
  candidates: [],
};

const VIOLATIONS_DETECTED: ConsoleCandidatesSnapshot = {
  totals: {
    total: NORMAL_CANDIDATES.length,
    awaitingFaceVerification:
      awaitingFaceCount(NORMAL_CANDIDATES) + 1,
  },
  candidates: NORMAL_CANDIDATES.map((c) =>
    c.id === "CND-1044"
      ? {
          ...c,
          face: { state: "unverified", label: "unverified" },
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
    case "service-degraded":
    case "normal":
    default:
      return NORMAL;
  }
}
