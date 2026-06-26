import type { AutodromeApi } from "./adapter";
import { createAutodromeClient } from "./client";
import {
  DEFAULT_LIVE_BASE_URLS,
  type ServiceName,
} from "./runtime-config";
import type { AndroidDevicePaths } from "./services/android-device-management";
import type { CandidatePaths } from "./services/candidate";
import type { ExamPaths } from "./services/exam";
import type { ExercisePaths } from "./services/exercise";
import type { MediaArchivePaths } from "./services/media-archive";
import type { VehiclePaths } from "./services/vehicle";
import type { ViolationRulePaths } from "./services/violation-rule";
import type { VirtualVehiclePaths } from "./services/virtual-vehicle";
import type { ReportingDocumentPaths } from "./services/reporting-document";
import type { DeploymentOperationsPaths } from "./services/deployment-operations";
import type { VehicleTelemetryPaths } from "./services/vehicle-telemetry";

export function createLiveAdapter(
  baseUrls: Record<ServiceName, string> = DEFAULT_LIVE_BASE_URLS,
): AutodromeApi {
  return {
    candidate: createAutodromeClient<CandidatePaths>({
      baseUrl: baseUrls.candidate,
    }),
    vehicle: createAutodromeClient<VehiclePaths>({
      baseUrl: baseUrls.vehicle,
    }),
    exam: createAutodromeClient<ExamPaths>({
      baseUrl: baseUrls.exam,
    }),
    exercise: createAutodromeClient<ExercisePaths>({
      baseUrl: baseUrls.exercise,
    }),
    violationRule: createAutodromeClient<ViolationRulePaths>({
      baseUrl: baseUrls.violationRule,
    }),
    mediaArchive: createAutodromeClient<MediaArchivePaths>({
      baseUrl: baseUrls.mediaArchive,
    }),
    androidDevice: createAutodromeClient<AndroidDevicePaths>({
      baseUrl: baseUrls.androidDevice,
    }),
    virtualVehicle: createAutodromeClient<VirtualVehiclePaths>({
      baseUrl: baseUrls.virtualVehicle,
    }),
    reportingDocument: createAutodromeClient<ReportingDocumentPaths>({
      baseUrl: baseUrls.reportingDocument,
    }),
    deploymentOperations: createAutodromeClient<DeploymentOperationsPaths>({
      baseUrl: baseUrls.deploymentOperations,
    }),
    vehicleTelemetry: createAutodromeClient<VehicleTelemetryPaths>({
      baseUrl: baseUrls.vehicleTelemetry,
    }),
  };
}
