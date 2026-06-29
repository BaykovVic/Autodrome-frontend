import type { paths } from "@/contracts/types/vehicle-simulator-rpi";
import { createAutodromeClient } from "../client";

export const vehicleSimulatorRpiApi = createAutodromeClient<paths>({
  baseUrl: "/api/vehicle-simulator-rpi/v1",
});

export type VehicleSimulatorRpiPaths = paths;
