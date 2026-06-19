import type { components } from "@/contracts/types/exam";
import type { MockScenario } from "../scenarios";

type Exam = components["schemas"]["Exam"];

const NOW = "2026-06-19T10:00:00Z";

const CANDIDATE_ANNA = {
  candidateId: "10000000-0000-4000-8000-000000000001",
};
const CANDIDATE_BORIS = {
  candidateId: "10000000-0000-4000-8000-000000000002",
};
const VEHICLE_RENAULT = {
  vehicleId: "20000000-0000-4000-8000-000000000001",
};
const VEHICLE_LADA = {
  vehicleId: "20000000-0000-4000-8000-000000000002",
};

const SCHEDULED_BASIC: Exam = {
  examId: "30000000-0000-4000-8000-000000000001",
  candidateRef: CANDIDATE_ANNA,
  vehicleRef: VEHICLE_RENAULT,
  examType: "autodromeBasic",
  status: "scheduled",
  scheduledAt: "2026-06-19T12:00:00Z",
  createdAt: NOW,
};

const IN_PROGRESS_BASIC: Exam = {
  examId: "30000000-0000-4000-8000-000000000002",
  candidateRef: CANDIDATE_ANNA,
  vehicleRef: VEHICLE_RENAULT,
  examType: "autodromeBasic",
  status: "inProgress",
  scheduledAt: "2026-06-19T09:00:00Z",
  startedAt: "2026-06-19T09:05:00Z",
  createdAt: NOW,
};

const FINISHED_PASSED: Exam = {
  examId: "30000000-0000-4000-8000-000000000003",
  candidateRef: CANDIDATE_BORIS,
  vehicleRef: VEHICLE_LADA,
  examType: "autodromeBasic",
  status: "finished",
  scheduledAt: "2026-06-18T11:00:00Z",
  startedAt: "2026-06-18T11:05:00Z",
  finishedAt: "2026-06-18T11:40:00Z",
  outcome: "passed",
  score: 88,
  createdAt: "2026-06-18T11:00:00Z",
};

export function examsFor(scenario: MockScenario): Exam[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [IN_PROGRESS_BASIC, SCHEDULED_BASIC];
    case "violations-detected":
      return [IN_PROGRESS_BASIC, FINISHED_PASSED];
    case "service-degraded":
      return [SCHEDULED_BASIC];
    case "normal":
    default:
      return [SCHEDULED_BASIC, FINISHED_PASSED];
  }
}
