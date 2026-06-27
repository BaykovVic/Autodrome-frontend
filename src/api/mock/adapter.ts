import type { AutodromeApi } from "../adapter";
import { createAutodromeClient } from "../client";
import { createMockFetch } from "./fetch";
import { DEFAULT_SCENARIO, type MockScenario } from "./scenarios";
import type { AndroidDevicePaths } from "../services/android-device-management";
import type { CandidatePaths } from "../services/candidate";
import type { ExamPaths } from "../services/exam";
import type { ExercisePaths } from "../services/exercise";
import type { MediaArchivePaths } from "../services/media-archive";
import type { VehiclePaths } from "../services/vehicle";
import type { ViolationRulePaths } from "../services/violation-rule";
import type { VirtualVehiclePaths } from "../services/virtual-vehicle";
import type { ReportingDocumentPaths } from "../services/reporting-document";
import type { DeploymentOperationsPaths } from "../services/deployment-operations";
import type { VehicleTelemetryPaths } from "../services/vehicle-telemetry";
import type { IdentitySecurityPaths } from "../services/identity-security";
import type { AuditPaths } from "../services/audit";
import type { CentralSyncPaths } from "../services/central-sync";

export function createMockAdapter(
  scenario: MockScenario = DEFAULT_SCENARIO,
): AutodromeApi {
  const mockFetch = createMockFetch(scenario);

  return {
    candidate: createAutodromeClient<CandidatePaths>({
      baseUrl: "/api/candidate/v1",
      fetch: mockFetch,
    }),
    vehicle: createAutodromeClient<VehiclePaths>({
      baseUrl: "/api/vehicle/v1",
      fetch: mockFetch,
    }),
    exam: createAutodromeClient<ExamPaths>({
      baseUrl: "/api/exam/v1",
      fetch: mockFetch,
    }),
    exercise: createAutodromeClient<ExercisePaths>({
      baseUrl: "/api/exercise/v1",
      fetch: mockFetch,
    }),
    violationRule: createAutodromeClient<ViolationRulePaths>({
      baseUrl: "/api/violation-rule/v1",
      fetch: mockFetch,
    }),
    mediaArchive: createAutodromeClient<MediaArchivePaths>({
      baseUrl: "/api/media-archive/v1",
      fetch: mockFetch,
    }),
    androidDevice: createAutodromeClient<AndroidDevicePaths>({
      baseUrl: "/api/android-device-management/v1",
      fetch: mockFetch,
    }),
    virtualVehicle: createAutodromeClient<VirtualVehiclePaths>({
      baseUrl: "/api/virtual-vehicle/v1",
      fetch: mockFetch,
    }),
    reportingDocument: createAutodromeClient<ReportingDocumentPaths>({
      baseUrl: "/api/reporting-document/v1",
      fetch: mockFetch,
    }),
    deploymentOperations: createAutodromeClient<DeploymentOperationsPaths>({
      baseUrl: "/api/deployment-operations/v1",
      fetch: mockFetch,
    }),
    vehicleTelemetry: createAutodromeClient<VehicleTelemetryPaths>({
      baseUrl: "/api/vehicle-telemetry/v1",
      fetch: mockFetch,
    }),
    identitySecurity: createAutodromeClient<IdentitySecurityPaths>({
      baseUrl: "/api/identity-security/v1",
      fetch: mockFetch,
    }),
    audit: createAutodromeClient<AuditPaths>({
      baseUrl: "/api/audit/v1",
      fetch: mockFetch,
    }),
    centralSync: createAutodromeClient<CentralSyncPaths>({
      baseUrl: "/api/central-sync/v1",
      fetch: mockFetch,
    }),
  };
}
