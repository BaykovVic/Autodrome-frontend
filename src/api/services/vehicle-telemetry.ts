import type { paths } from "@/contracts/types/vehicle-telemetry";
import { createAutodromeClient } from "../client";

export const vehicleTelemetryApi = createAutodromeClient<paths>({
  baseUrl: "/api/vehicle-telemetry/v1",
});

export type VehicleTelemetryPaths = paths;
