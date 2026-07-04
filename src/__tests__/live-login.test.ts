import { describe, expect, it, vi } from "vitest";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import { liveLogin } from "@/app/login/_components/liveLogin";

function adapterWith(POST: unknown): AutodromeApi {
  return { identitySecurity: { POST } } as unknown as AutodromeApi;
}

describe("liveLogin", () => {
  it("posts credentials to /auth/login and maps the token pair", async () => {
    const POST = vi.fn(async () => ({
      data: {
        accessToken: "a",
        refreshToken: "r",
        expiresAt: "2026-01-01T00:00:00Z",
        scopes: ["operator"],
      },
    }));
    const res = await liveLogin(adapterWith(POST), {
      login: "pilot.operator",
      password: "secret",
    });
    expect(POST).toHaveBeenCalledWith("/auth/login", {
      body: { login: "pilot.operator", password: "secret" },
    });
    expect(res.accessToken).toBe("a");
    expect(res.scopes).toEqual(["operator"]);
  });

  it("propagates an ApiError (401 invalid credentials)", async () => {
    const POST = vi.fn(async () => {
      throw new ApiError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "bad creds",
        url: "/api/identity-security/v1/auth/login",
      });
    });
    await expect(
      liveLogin(adapterWith(POST), { login: "u", password: "p" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("throws when the endpoint returns no token pair", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    await expect(
      liveLogin(adapterWith(POST), { login: "u", password: "p" }),
    ).rejects.toThrow(/no token pair/i);
  });
});
