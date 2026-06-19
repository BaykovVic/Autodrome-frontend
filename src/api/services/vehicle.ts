import type { paths } from "@/contracts/types/vehicle";
import { createAutodromeClient } from "../client";

export const vehicleApi = createAutodromeClient<paths>({
  baseUrl: "/api/vehicle/v1",
});

export type VehiclePaths = paths;
