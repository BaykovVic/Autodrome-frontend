import type { paths } from "@/contracts/types/audit";
import { createAutodromeClient } from "../client";

export const auditApi = createAutodromeClient<paths>({
  baseUrl: "/api/audit/v1",
});

export type AuditPaths = paths;
