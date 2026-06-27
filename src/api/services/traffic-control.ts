import type { paths } from "@/contracts/types/traffic-control";
import { createAutodromeClient } from "../client";

export const trafficControlApi = createAutodromeClient<paths>({
  baseUrl: "/api/traffic-control/v1",
});

export type TrafficControlPaths = paths;
