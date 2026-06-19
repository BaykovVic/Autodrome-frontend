export { CORRELATION_HEADER, newCorrelationId } from "./correlation";
export { ApiError, parseErrorResponse } from "./errors";
export type { ErrorEnvelopeBody } from "./errors";
export {
  createAutodromeClient,
} from "./client";
export type { ApiClientOptions, AutodromeClient } from "./client";

export { candidateApi } from "./services/candidate";
export type { CandidatePaths } from "./services/candidate";
export { vehicleApi } from "./services/vehicle";
export type { VehiclePaths } from "./services/vehicle";
export { examApi } from "./services/exam";
export type { ExamPaths } from "./services/exam";
export { exerciseApi } from "./services/exercise";
export type { ExercisePaths } from "./services/exercise";
export { violationRuleApi } from "./services/violation-rule";
export type { ViolationRulePaths } from "./services/violation-rule";
