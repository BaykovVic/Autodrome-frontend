import type { AutodromeApi } from "./adapter";
import { candidateApi } from "./services/candidate";
import { examApi } from "./services/exam";
import { exerciseApi } from "./services/exercise";
import { vehicleApi } from "./services/vehicle";
import { violationRuleApi } from "./services/violation-rule";

export function createLiveAdapter(): AutodromeApi {
  return {
    candidate: candidateApi,
    vehicle: vehicleApi,
    exam: examApi,
    exercise: exerciseApi,
    violationRule: violationRuleApi,
  };
}
