import type { AutodromeClient } from "./client";
import type { CandidatePaths } from "./services/candidate";
import type { ExamPaths } from "./services/exam";
import type { ExercisePaths } from "./services/exercise";
import type { VehiclePaths } from "./services/vehicle";
import type { ViolationRulePaths } from "./services/violation-rule";

export type ApiAdapterMode = "live" | "mock";

export interface AutodromeApi {
  candidate: AutodromeClient<CandidatePaths>;
  vehicle: AutodromeClient<VehiclePaths>;
  exam: AutodromeClient<ExamPaths>;
  exercise: AutodromeClient<ExercisePaths>;
  violationRule: AutodromeClient<ViolationRulePaths>;
}

export type ApiAdapterOptions = {
  mode?: ApiAdapterMode;
  scenario?: import("./mock/scenarios").MockScenario;
};
