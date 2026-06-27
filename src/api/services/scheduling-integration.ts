import type { paths } from "@/contracts/types/scheduling-integration";
import { createAutodromeClient } from "../client";

export const schedulingIntegrationApi = createAutodromeClient<paths>({
  baseUrl: "/api/scheduling-integration/v1",
});

export type SchedulingIntegrationPaths = paths;
