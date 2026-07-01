import type { paths } from "@/contracts/types/api-gateway-bff";

import { createAutodromeClient } from "../client";

export const apiGatewayBffApi = createAutodromeClient<paths>({
  baseUrl: "/api/api-gateway-bff/v1",
});

export type ApiGatewayBffPaths = paths;
