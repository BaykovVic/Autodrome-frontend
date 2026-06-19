import type { paths } from "@/contracts/types/exam";
import { createAutodromeClient } from "../client";

export const examApi = createAutodromeClient<paths>({
  baseUrl: "/api/exam/v1",
});

export type ExamPaths = paths;
