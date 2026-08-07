import type { AutodromeApi } from "./adapter";
import { createAutodromeClient } from "./client";
import { getAccessToken } from "./session-tokens";
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
  authTokenProvider: () => string | null = getAccessToken,
): AutodromeApi {
  // Every live client authenticates with the current session bearer.
  const make = <Paths extends object>(baseUrl: string) =>
    createAutodromeClient<Paths>({ baseUrl, authTokenProvider });

  return {
    candidate: make<CandidatePaths>(baseUrls.candidate),
    vehicle: make<VehiclePaths>(baseUrls.vehicle),
    exam: make<ExamPaths>(baseUrls.exam),
    exercise: make<ExercisePaths>(baseUrls.exercise),
    violationRule: make<ViolationRulePaths>(baseUrls.violationRule),
    mediaArchive: make<MediaArchivePaths>(baseUrls.mediaArchive),
    androidDevice: make<AndroidDevicePaths>(baseUrls.androidDevice),
    virtualVehicle: make<VirtualVehiclePaths>(baseUrls.virtualVehicle),
    reportingDocument: make<ReportingDocumentPaths>(
      baseUrls.reportingDocument,
    ),
    deploymentOperations: make<DeploymentOperationsPaths>(
      baseUrls.deploymentOperations,
    ),
    vehicleTelemetry: make<VehicleTelemetryPaths>(baseUrls.vehicleTelemetry),
    identitySecurity: make<IdentitySecurityPaths>(baseUrls.identitySecurity),
    apiGatewayBff: make<ApiGatewayBffPaths>(baseUrls.apiGatewayBff),
    audit: make<AuditPaths>(baseUrls.audit),
    centralSync: make<CentralSyncPaths>(baseUrls.centralSync),
    referenceData: make<ReferenceDataPaths>(baseUrls.referenceData),
    autodromeGeometry: make<AutodromeGeometryPaths>(
      baseUrls.autodromeGeometry,
    ),
    schedulingIntegration: make<SchedulingIntegrationPaths>(
      baseUrls.schedulingIntegration,
    ),
    trafficControl: make<TrafficControlPaths>(baseUrls.trafficControl),
    biometry: make<BiometryPaths>(baseUrls.biometry),
    vehicleSimulatorRpi: make<VehicleSimulatorRpiPaths>(
      baseUrls.vehicleSimulatorRpi,
    ),
    vehicleEdgeGateway: make<VehicleEdgeGatewayPaths>(
      baseUrls.vehicleEdgeGateway,
    ),
  };
}
