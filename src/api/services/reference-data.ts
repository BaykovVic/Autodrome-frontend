import type { paths } from "@/contracts/types/reference-data";
import { createAutodromeClient } from "../client";

export const referenceDataApi = createAutodromeClient<paths>({
  baseUrl: "/api/reference-data/v1",
});

export type ReferenceDataPaths = paths;
