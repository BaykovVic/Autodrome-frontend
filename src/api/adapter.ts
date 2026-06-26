import type { AutodromeClient } from "./client";
import type { AndroidDevicePaths } from "./services/android-device-management";
import type { CandidatePaths } from "./services/candidate";
import type { ExamPaths } from "./services/exam";
import type { ExercisePaths } from "./services/exercise";
import type { MediaArchivePaths } from "./services/media-archive";
import type { VehiclePaths } from "./services/vehicle";
import type { ViolationRulePaths } from "./services/violation-rule";
import type { VirtualVehiclePaths } from "./services/virtual-vehicle";
import type { ReportingDocumentPaths } from "./services/reporting-document";

export type ApiAdapterMode = "live" | "mock";

export interface AutodromeApi {
  candidate: AutodromeClient<CandidatePaths>;
  vehicle: AutodromeClient<VehiclePaths>;
  exam: AutodromeClient<ExamPaths>;
  exercise: AutodromeClient<ExercisePaths>;
  violationRule: AutodromeClient<ViolationRulePaths>;
  mediaArchive: AutodromeClient<MediaArchivePaths>;
  androidDevice: AutodromeClient<AndroidDevicePaths>;
  virtualVehicle: AutodromeClient<VirtualVehiclePaths>;
  reportingDocument: AutodromeClient<ReportingDocumentPaths>;
}

export type ApiAdapterOptions = {
  mode?: ApiAdapterMode;
  scenario?: import("./mock/scenarios").MockScenario;
};
