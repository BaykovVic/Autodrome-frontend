import { describe, expect, it, vi } from "vitest";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import {
  liveAssignRole,
  liveListUserRoles,
  liveRevokeRole,
} from "@/app/(shell)/security/_components/liveRoleManagement";

function adapterWith(handlers: Record<string, unknown>): AutodromeApi {
  return { identitySecurity: handlers } as unknown as AutodromeApi;
}

describe("liveRoleManagement", () => {
  it("assigns a role via POST and maps the resulting canonical set", async () => {
    const POST = vi.fn(async () => ({
      data: { userId: "u1", roles: ["operator", "inspector"] },
    }));
    const res = await liveAssignRole(adapterWith({ POST }), "u1", "inspector");
    expect(POST).toHaveBeenCalledWith("/v1/users/{userId}/roles", {
      params: { path: { userId: "u1" } },
      body: { role: "inspector" },
    });
    expect(res).toEqual({ userId: "u1", roles: ["operator", "inspector"] });
  });

  it("revokes a role via DELETE keyed by roleKey", async () => {
    const DELETE = vi.fn(async () => ({
      data: { userId: "u1", roles: ["operator"] },
    }));
    const res = await liveRevokeRole(adapterWith({ DELETE }), "u1", "inspector");
    expect(DELETE).toHaveBeenCalledWith(
      "/v1/users/{userId}/roles/{roleKey}",
      { params: { path: { userId: "u1", roleKey: "inspector" } } },
    );
    expect(res.roles).toEqual(["operator"]);
  });

  it("lists a user's current roles via GET", async () => {
    const GET = vi.fn(async () => ({ data: { userId: "u1", roles: ["admin"] } }));
    const res = await liveListUserRoles(adapterWith({ GET }), "u1");
    expect(res.roles).toEqual(["admin"]);
  });

  it("propagates an ApiError (403 forbidden) from assign", async () => {
    const POST = vi.fn(async () => {
      throw new ApiError({
        status: 403,
        code: "FORBIDDEN",
        message: "no",
        url: "/api/identity-security/v1/users/u1/roles",
      });
    });
    await expect(
      liveAssignRole(adapterWith({ POST }), "u1", "admin"),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("throws when the endpoint returns no body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    await expect(
      liveAssignRole(adapterWith({ POST }), "u1", "admin"),
    ).rejects.toThrow(/no body/i);
  });
});
