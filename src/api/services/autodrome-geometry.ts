import type { paths } from "@/contracts/types/autodrome-geometry";
import { createAutodromeClient } from "../client";

export const autodromeGeometryApi = createAutodromeClient<paths>({
  baseUrl: "/api/autodrome-geometry/v1",
});

export type AutodromeGeometryPaths = paths;
