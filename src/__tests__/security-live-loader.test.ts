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
      permissions: ["user.read", "user.assign"],
    });
    expect(v.actorId).toBe("20000000-0000-4000-8000-000000000001");
    expect(v.actorType).toBe("user");
    expect(v.roles).toEqual(["admin", "techAdmin"]);
    expect(v.permissions).toEqual(["user.read", "user.assign"]);
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
  it("populates current actor from /auth/me", async () => {
    const GET = vi.fn(async () => ({
      data: {
        actorId: "20000000-0000-4000-8000-000000000001",
        actorType: "user",
        roles: ["admin"],
        permissions: ["user.read"],
      },
    }));
    const api = makeApi({
      identitySecurity: {
        GET,
      } as unknown as AutodromeApi["identitySecurity"],
    });
    const snap = await liveSecurityLoader(api);
    expect(GET).toHaveBeenCalledWith("/auth/me", {});
    expect(snap.currentActor?.actorId).toBe(
      "20000000-0000-4000-8000-000000000001",
    );
    expect(snap.operators).toHaveLength(1);
    // Always returns canonical 6-role catalog.
    expect(snap.roles).toHaveLength(6);
    expect(snap.degradedNote).toMatch(/operator list/i);
  });

  it("returns degraded snapshot when /auth/me returns no body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      identitySecurity: {
        GET,
      } as unknown as AutodromeApi["identitySecurity"],
    });
    const snap = await liveSecurityLoader(api);
    expect(snap.currentActor).toBeNull();
    expect(snap.operators).toEqual([]);
    expect(snap.degradedNote).toMatch(/no body/i);
  });

  it("propagates ApiError when /auth/me fails", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 401,
        url: "/auth/me",
        code: "GATEWAY_UNAUTHENTICATED",
        message: "Authentication missing.",
      });
    });
    const api = makeApi({
      identitySecurity: {
        GET,
      } as unknown as AutodromeApi["identitySecurity"],
    });
    await expect(liveSecurityLoader(api)).rejects.toBeInstanceOf(ApiError);
  });
});
