import type { paths } from "@/contracts/types/central-sync";
import { createAutodromeClient } from "../client";

export const centralSyncApi = createAutodromeClient<paths>({
  baseUrl: "/api/central-sync/v1",
});

export type CentralSyncPaths = paths;
