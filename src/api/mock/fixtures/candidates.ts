import type { components } from "@/contracts/types/candidate";
import type { MockScenario } from "../scenarios";

type Candidate = components["schemas"]["Candidate"];

const NOW = "2026-06-19T10:00:00Z";

const ANNA: Candidate = {
  candidateId: "10000000-0000-4000-8000-000000000001",
  firstName: "Anna",
  lastName: "Petrova",
  birthDate: "2002-04-12",
  identityDocument: {
    documentType: "idCard",
    documentNumber: "MK4422119",
  },
  status: "active",
  createdAt: NOW,
};

const BORIS: Candidate = {
  candidateId: "10000000-0000-4000-8000-000000000002",
  firstName: "Boris",
  lastName: "Ivanov",
  birthDate: "1999-11-30",
  identityDocument: {
    documentType: "drivingLicense",
    documentNumber: "DL7790314",
  },
  status: "registered",
  createdAt: NOW,
};

export function candidatesFor(scenario: MockScenario): Candidate[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [{ ...ANNA, status: "active" }, BORIS];
    case "violations-detected":
      return [{ ...ANNA, status: "active" }, BORIS];
    case "service-degraded":
      return [ANNA];
    case "normal":
    default:
      return [ANNA, BORIS];
  }
}
