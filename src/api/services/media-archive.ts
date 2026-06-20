import type { paths } from "@/contracts/types/media-archive";
import { createAutodromeClient } from "../client";

export const mediaArchiveApi = createAutodromeClient<paths>({
  baseUrl: "/api/media-archive/v1",
});

export type MediaArchivePaths = paths;
