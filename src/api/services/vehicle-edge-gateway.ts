import type { paths } from "@/contracts/types/vehicle-edge-gateway";
import { createAutodromeClient } from "../client";

export const vehicleEdgeGatewayApi = createAutodromeClient<paths>({
  baseUrl: "/api/vehicle-edge-gateway/v1",
});

export type VehicleEdgeGatewayPaths = paths;
