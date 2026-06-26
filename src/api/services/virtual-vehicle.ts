import type { paths } from "@/contracts/types/virtual-vehicle";
import { createAutodromeClient } from "../client";

export const virtualVehicleApi = createAutodromeClient<paths>({
  baseUrl: "/api/virtual-vehicle/v1",
});

export type VirtualVehiclePaths = paths;
