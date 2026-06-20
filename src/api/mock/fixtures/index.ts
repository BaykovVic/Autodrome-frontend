import { candidatesFor } from "./candidates";
import { examsFor } from "./exams";
import { exerciseGroupsFor } from "./exerciseGroups";
import { exercisesFor } from "./exercises";
import { rulesFor } from "./rules";
import { vehiclesFor } from "./vehicles";
import { violationsFor } from "./violations";
import type { MockScenario } from "../scenarios";

export {
  candidatesFor,
  vehiclesFor,
  examsFor,
  exercisesFor,
  exerciseGroupsFor,
  violationsFor,
  rulesFor,
};

export type LocalNodeFixtures = {
  candidates: ReturnType<typeof candidatesFor>;
  vehicles: ReturnType<typeof vehiclesFor>;
  exams: ReturnType<typeof examsFor>;
  exercises: ReturnType<typeof exercisesFor>;
  exerciseGroups: ReturnType<typeof exerciseGroupsFor>;
  violations: ReturnType<typeof violationsFor>;
  rules: ReturnType<typeof rulesFor>;
};

export function selectFixtures(scenario: MockScenario): LocalNodeFixtures {
  return {
    candidates: candidatesFor(scenario),
    vehicles: vehiclesFor(scenario),
    exams: examsFor(scenario),
    exercises: exercisesFor(scenario),
    exerciseGroups: exerciseGroupsFor(scenario),
    violations: violationsFor(scenario),
    rules: rulesFor(scenario),
  };
}
