import type { paths } from "@/contracts/types/candidate";
import { createAutodromeClient } from "../client";

export const candidateApi = createAutodromeClient<paths>({
  baseUrl: "/api/candidate/v1",
});

export type CandidatePaths = paths;
