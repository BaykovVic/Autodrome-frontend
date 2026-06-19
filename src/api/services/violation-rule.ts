import type { paths } from "@/contracts/types/violation-rule";
import { createAutodromeClient } from "../client";

export const violationRuleApi = createAutodromeClient<paths>({
  baseUrl: "/api/violation-rule/v1",
});

export type ViolationRulePaths = paths;
