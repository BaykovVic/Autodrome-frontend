import type { components } from "@/contracts/types/exercise";
import type { MockScenario } from "../scenarios";

type Exercise = components["schemas"]["Exercise"];

const NOW = "2026-06-19T10:00:00Z";

const PARKING: Exercise = {
  exerciseId: "40000000-0000-4000-8000-000000000001",
  code: "EX-PARK-01",
  title: "Parallel parking",
  status: "published",
  currentVersion: {
    versionId: "40000001-0000-4000-8000-000000000001",
    versionNumber: 3,
    publishedAt: NOW,
  },
  createdAt: NOW,
};

const HILL_START: Exercise = {
  exerciseId: "40000000-0000-4000-8000-000000000002",
  code: "EX-HILL-01",
  title: "Hill start",
  status: "published",
  currentVersion: {
    versionId: "40000001-0000-4000-8000-000000000002",
    versionNumber: 1,
    publishedAt: NOW,
  },
  createdAt: NOW,
};

const DRAFT_LANE_CHANGE: Exercise = {
  exerciseId: "40000000-0000-4000-8000-000000000003",
  code: "EX-LANE-01",
  title: "Lane change",
  status: "draft",
  createdAt: NOW,
};

export function exercisesFor(scenario: MockScenario): Exercise[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [PARKING, HILL_START];
    case "violations-detected":
      return [PARKING, HILL_START];
    case "service-degraded":
      return [PARKING];
    case "normal":
    default:
      return [PARKING, HILL_START, DRAFT_LANE_CHANGE];
  }
}
