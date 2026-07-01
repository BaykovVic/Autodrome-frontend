import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import {
  liveSecurityLoader,
  mapActorDtoToConsole,
  mapActorTypeDtoToConsole,
  mapRoleDtoToConsole,
} from "@/app/(shell)/security/_components/liveSecurityLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapRoleDtoToConsole", () => {
  it("passes canonical role enum 1:1", () => {
    expect(mapRoleDtoToConsole("admin")).toBe("admin");
    expect(mapRoleDtoToConsole("operator")).toBe("operator");
    expect(mapRoleDtoToConsole("techAdmin")).toBe("techAdmin");
  });
});

describe("mapActorTypeDtoToConsole", () => {
  it("passes canonical actor type 1:1", () => {
    expect(mapActorTypeDtoToConsole("user")).toBe("user");
    expect(mapActorTypeDtoToConsole("device")).toBe("device");
  });
});

describe("mapActorDtoToConsole", () => {
  it("maps Actor DTO with roles + permissions", () => {
    const v = mapActorDtoToConsole({
      actorId: "20000000-0000-4000-8000-000000000001",
      actorType: "user",
      roles: ["admin", "techAdmin"],
      permissions: ["identity.manage"],
    });
    expect(v.actorId).toBe("20000000-0000-4000-8000-000000000001");
    expect(v.actorType).toBe("user");
    expect(v.roles).toEqual(["admin", "techAdmin"]);
    expect(v.permissions).toEqual(["identity.manage"]);
  });

  it("handles empty roles + permissions", () => {
    const v = mapActorDtoToConsole({
      actorId: "20000000-0000-4000-8000-000000000002",
      actorType: "service",
      roles: [],
      permissions: [],
    });
    expect(v.roles).toEqual([]);
    expect(v.permissions).toEqual([]);
  });
});

describe("liveSecurityLoader: integration", () => {
  it("populates current actor from BFF /me", async () => {
    const GET = vi.fn(async () => ({
      data: {
        actorId: "20000000-0000-4000-8000-000000000001",
        actorType: "user",
        roles: ["admin"],
        permissions: ["identity.manage"],
      },
    }));
    const api = makeApi({
      apiGatewayBff: {
        GET,
      } as unknown as AutodromeApi["apiGatewayBff"],
    });
    const snap = await liveSecurityLoader(api);
    expect(GET).toHaveBeenCalledWith("/me", {});
    expect(snap.currentActor?.actorId).toBe(
      "20000000-0000-4000-8000-000000000001",
    );
    expect(snap.operators).toHaveLength(1);
    // Always returns canonical 6-role catalog.
    expect(snap.roles).toHaveLength(6);
    expect(snap.degradedNote).toMatch(/operator list/i);
  });

  it("returns degraded snapshot when BFF /me returns no body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      apiGatewayBff: {
        GET,
      } as unknown as AutodromeApi["apiGatewayBff"],
    });
    const snap = await liveSecurityLoader(api);
    expect(snap.currentActor).toBeNull();
    expect(snap.operators).toEqual([]);
    expect(snap.degradedNote).toMatch(/no body/i);
  });

  it("propagates ApiError when BFF /me fails", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 401,
        url: "/me",
        code: "GATEWAY_UNAUTHENTICATED",
        message: "Authentication missing.",
      });
    });
    const api = makeApi({
      apiGatewayBff: {
        GET,
      } as unknown as AutodromeApi["apiGatewayBff"],
    });
    await expect(liveSecurityLoader(api)).rejects.toBeInstanceOf(ApiError);
  });
});
