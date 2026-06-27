import type { paths } from "@/contracts/types/biometry";
import { createAutodromeClient } from "../client";

export const biometryApi = createAutodromeClient<paths>({
  baseUrl: "/api/biometry/v1",
});

export type BiometryPaths = paths;
