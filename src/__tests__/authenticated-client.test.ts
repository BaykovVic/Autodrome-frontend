import { describe, expect, it, vi } from "vitest";

import type { AutodromeApi } from "@/api/adapter";
import { createAutodromeClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { ApiGatewayBffPaths } from "@/api/services/api-gateway-bff";
import { liveSessionLoader } from "@/app/(shell)/_session/liveSessionLoader";

function okJson(): Response {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function clientWith(
  authTokenProvider: (() => string | null | undefined) | undefined,
  capture: (req: Request) => void,
) {
  return createAutodromeClient<ApiGatewayBffPaths>({
    baseUrl: "/api/api-gateway-bff/v1",
    authTokenProvider,
    fetch: async (input) => {
      capture(input as Request);
      return okJson();
    },
  });
}

describe("authenticated API client — Authorization header", () => {
  it("adds Bearer token when a token is provided, keeping Correlation-Id", async () => {
    let req: Request | undefined;
    const client = clientWith(
      () => "tok-123",
      (r) => (req = r),
    );
    await client.GET("/me", {});
    expect(req?.headers.get("Authorization")).toBe("Bearer tok-123");
    expect(req?.headers.get("Correlation-Id")).toBeTruthy();
  });

  it("omits Authorization when the provider returns no token", async () => {
    let req: Request | undefined;
    const client = clientWith(
      () => null,
      (r) => (req = r),
    );
    await client.GET("/me", {});
    expect(req?.headers.get("Authorization")).toBeNull();
  });

  it("omits Authorization when no provider is configured (mock mode)", async () => {
    let req: Request | undefined;
    const client = clientWith(undefined, (r) => (req = r));
    await client.GET("/me", {});
    expect(req?.headers.get("Authorization")).toBeNull();
  });
});

function bffAdapter(get: () => Promise<{ data?: unknown }>): AutodromeApi {
  return { apiGatewayBff: { GET: get } } as unknown as AutodromeApi;
}

describe("liveSessionLoader — 401/403 split", () => {
  it("maps 401 to unauthenticated (session/auth-required flow)", async () => {
    const result = await liveSessionLoader(
      bffAdapter(async () => {
        throw new ApiError({
          status: 401,
          code: "UNAUTHORIZED",
          message: "no token",
          url: "/api/api-gateway-bff/v1/me",
        });
      }),
    );
    expect(result.status).toBe("unauthenticated");
  });

  it("rethrows 403 (kept as forbidden state, not signed out)", async () => {
    await expect(
      liveSessionLoader(
        bffAdapter(async () => {
          throw new ApiError({
            status: 403,
            code: "FORBIDDEN",
            message: "denied",
            url: "/api/api-gateway-bff/v1/me",
          });
        }),
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("resolves a 401 once (no infinite retry loop)", async () => {
    const get = vi.fn(async () => {
      throw new ApiError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "no token",
        url: "/api/api-gateway-bff/v1/me",
      });
    });
    await liveSessionLoader(bffAdapter(get));
    expect(get).toHaveBeenCalledTimes(1);
  });
});
