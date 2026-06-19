import type { paths } from "@/contracts/types/exercise";
import { createAutodromeClient } from "../client";

export const exerciseApi = createAutodromeClient<paths>({
  baseUrl: "/api/exercise/v1",
});

export type ExercisePaths = paths;
