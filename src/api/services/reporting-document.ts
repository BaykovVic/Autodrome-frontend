import type { paths } from "@/contracts/types/reporting-document";
import { createAutodromeClient } from "../client";

export const reportingDocumentApi = createAutodromeClient<paths>({
  baseUrl: "/api/reporting-document/v1",
});

export type ReportingDocumentPaths = paths;
