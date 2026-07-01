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
import type { IdentitySecurityPaths } from "./services/identity-security";
import type { ApiGatewayBffPaths } from "./services/api-gateway-bff";
import type { AuditPaths } from "./services/audit";
import type { CentralSyncPaths } from "./services/central-sync";
import type { ReferenceDataPaths } from "./services/reference-data";
import type { AutodromeGeometryPaths } from "./services/autodrome-geometry";
import type { SchedulingIntegrationPaths } from "./services/scheduling-integration";
import type { TrafficControlPaths } from "./services/traffic-control";
import type { BiometryPaths } from "./services/biometry";
import type { VehicleSimulatorRpiPaths } from "./services/vehicle-simulator-rpi";
import type { VehicleEdgeGatewayPaths } from "./services/vehicle-edge-gateway";

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
    identitySecurity: createAutodromeClient<IdentitySecurityPaths>({
      baseUrl: baseUrls.identitySecurity,
    }),
    apiGatewayBff: createAutodromeClient<ApiGatewayBffPaths>({
      baseUrl: baseUrls.apiGatewayBff,
    }),
    audit: createAutodromeClient<AuditPaths>({
      baseUrl: baseUrls.audit,
    }),
    centralSync: createAutodromeClient<CentralSyncPaths>({
      baseUrl: baseUrls.centralSync,
    }),
    referenceData: createAutodromeClient<ReferenceDataPaths>({
      baseUrl: baseUrls.referenceData,
    }),
    autodromeGeometry: createAutodromeClient<AutodromeGeometryPaths>({
      baseUrl: baseUrls.autodromeGeometry,
    }),
    schedulingIntegration: createAutodromeClient<SchedulingIntegrationPaths>({
      baseUrl: baseUrls.schedulingIntegration,
    }),
    trafficControl: createAutodromeClient<TrafficControlPaths>({
      baseUrl: baseUrls.trafficControl,
    }),
    biometry: createAutodromeClient<BiometryPaths>({
      baseUrl: baseUrls.biometry,
    }),
    vehicleSimulatorRpi: createAutodromeClient<VehicleSimulatorRpiPaths>({
      baseUrl: baseUrls.vehicleSimulatorRpi,
    }),
    vehicleEdgeGateway: createAutodromeClient<VehicleEdgeGatewayPaths>({
      baseUrl: baseUrls.vehicleEdgeGateway,
    }),
  };
}
