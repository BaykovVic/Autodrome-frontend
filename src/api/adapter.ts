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
import type { DeploymentOperationsPaths } from "./services/deployment-operations";
import type { VehicleTelemetryPaths } from "./services/vehicle-telemetry";
import type { IdentitySecurityPaths } from "./services/identity-security";
import type { AuditPaths } from "./services/audit";
import type { CentralSyncPaths } from "./services/central-sync";
import type { ReferenceDataPaths } from "./services/reference-data";
import type { AutodromeGeometryPaths } from "./services/autodrome-geometry";
import type { SchedulingIntegrationPaths } from "./services/scheduling-integration";
import type { TrafficControlPaths } from "./services/traffic-control";

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
  deploymentOperations: AutodromeClient<DeploymentOperationsPaths>;
  vehicleTelemetry: AutodromeClient<VehicleTelemetryPaths>;
  identitySecurity: AutodromeClient<IdentitySecurityPaths>;
  audit: AutodromeClient<AuditPaths>;
  centralSync: AutodromeClient<CentralSyncPaths>;
  referenceData: AutodromeClient<ReferenceDataPaths>;
  autodromeGeometry: AutodromeClient<AutodromeGeometryPaths>;
  schedulingIntegration: AutodromeClient<SchedulingIntegrationPaths>;
  trafficControl: AutodromeClient<TrafficControlPaths>;
}

export type ApiAdapterOptions = {
  mode?: ApiAdapterMode;
  scenario?: import("./mock/scenarios").MockScenario;
};
