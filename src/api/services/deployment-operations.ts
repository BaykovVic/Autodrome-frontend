import type { paths } from "@/contracts/types/deployment-operations";
import { createAutodromeClient } from "../client";

export const deploymentOperationsApi = createAutodromeClient<paths>({
  baseUrl: "/api/deployment-operations/v1",
});

export type DeploymentOperationsPaths = paths;
