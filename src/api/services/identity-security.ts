import type { paths } from "@/contracts/types/identity-security";
import { createAutodromeClient } from "../client";

export const identitySecurityApi = createAutodromeClient<paths>({
  baseUrl: "/api/identity-security/v1",
});

export type IdentitySecurityPaths = paths;
