import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";
import { createMockAdapter } from "@/api/mock/adapter";

describe("mock handlers", () => {
  it("returns vehicles list from fixtures for the normal scenario", async () => {
    const api = createMockAdapter("normal");
    const { data, response } = await api.vehicle.GET("/vehicles", {
      params: { query: { pageSize: 10 } },
    });
    expect(response.status).toBe(200);
    expect((data?.items?.length ?? 0)).toBeGreaterThan(0);
  });

  it("returns 503 on vehicles list for service-degraded scenario", async () => {
    const api = createMockAdapter("service-degraded");
    await expect(
      api.vehicle.GET("/vehicles", {
        params: { query: { pageSize: 10 } },
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      code: "SERVICE_DEGRADED",
    });
  });

  it("returns ApiError with MOCK_HANDLER_NOT_FOUND for unmapped path", async () => {
    const api = createMockAdapter("normal");
    await expect(
      api.candidate.GET("/candidates/{candidateId}", {
        params: {
          path: {
            candidateId: "10000000-0000-4000-8000-000000000001",
          },
        },
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
