import type { components } from "@/contracts/types/exercise";
import type { MockScenario } from "../scenarios";

type ExerciseGroup = components["schemas"]["ExerciseGroup"];

const NOW = "2026-06-19T10:00:00Z";

const BASIC: ExerciseGroup = {
  groupId: "70000000-0000-4000-8000-000000000001",
  title: "Autodrome basic — full pass",
  exerciseOrder: [
    { exerciseId: "40000000-0000-4000-8000-000000000001" },
    { exerciseId: "40000000-0000-4000-8000-000000000002" },
  ],
  categoryRefs: [],
  createdAt: NOW,
};

const ADVANCED: ExerciseGroup = {
  groupId: "70000000-0000-4000-8000-000000000002",
  title: "Autodrome advanced — full pass",
  exerciseOrder: [
    { exerciseId: "40000000-0000-4000-8000-000000000001" },
    { exerciseId: "40000000-0000-4000-8000-000000000002" },
    { exerciseId: "40000000-0000-4000-8000-000000000003" },
  ],
  categoryRefs: [],
  createdAt: NOW,
};

export function exerciseGroupsFor(scenario: MockScenario): ExerciseGroup[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [BASIC];
    case "violations-detected":
      return [BASIC, ADVANCED];
    case "service-degraded":
      return [BASIC];
    case "normal":
    default:
      return [BASIC, ADVANCED];
  }
}
