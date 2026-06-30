import { describe, expect, it } from "vitest";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import {
  actorInitials,
  primaryRoleLabel,
  sessionHasPermission,
  sessionHasRole,
  type ConsoleSessionActor,
} from "@/app/(shell)/_session/consoleSession";
import { consoleSessionFor } from "@/app/(shell)/_session/consoleSessionFixtures";
import {
  liveSessionLoader,
  mapSessionActor,
} from "@/app/(shell)/_session/liveSessionLoader";

const ACTOR: ConsoleSessionActor = {
  actorId: "20000000-0000-4000-8000-000000000001",
  actorType: "user",
  label: "Anna Petrova",
  roles: ["admin", "techAdmin"],
  permissions: ["user.read", "user.assign"],
};

describe("session view-model helpers", () => {
  it("sessionHasRole / sessionHasPermission are pure membership checks", () => {
    expect(sessionHasRole(ACTOR, "admin")).toBe(true);
    expect(sessionHasRole(ACTOR, "operator")).toBe(false);
    expect(sessionHasPermission(ACTOR, "user.assign")).toBe(true);
    expect(sessionHasPermission(ACTOR, "exam.delete")).toBe(false);
  });

  it("actorInitials derives 1-2 letter initials", () => {
    expect(actorInitials("Anna Petrova")).toBe("AP");
    expect(actorInitials("Boris")).toBe("BO");
    expect(actorInitials("   ")).toBe("?");
  });

  it("primaryRoleLabel resolves the first canonical role label", () => {
    expect(primaryRoleLabel(ACTOR)).toBe("Administrator");
    expect(
      primaryRoleLabel({ ...ACTOR, roles: [] }),
    ).toBe("No role");
  });
});

describe("consoleSessionFor fixtures", () => {
  it("normal scenario authenticates an operator", () => {
    const result = consoleSessionFor("normal");
    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.actor.roles).toContain("admin");
      expect(result.actor.permissions.length).toBeGreaterThan(0);
    }
  });

  it("empty scenario yields an unauthenticated session", () => {
    const result = consoleSessionFor("empty");
    expect(result.status).toBe("unauthenticated");
    if (result.status === "unauthenticated") {
      expect(result.reason).toMatch(/no active operator session/i);
    }
  });
});

function adapterWith(
  get: () => Promise<{ data?: unknown }>,
): AutodromeApi {
  return {
    identitySecurity: { GET: get },
  } as unknown as AutodromeApi;
}

describe("liveSessionLoader", () => {
  it("maps a 200 actor body to an authenticated session (1:1 enums)", async () => {
    const result = await liveSessionLoader(
      adapterWith(async () => ({
        data: {
          actorId: "abc",
          actorType: "user",
          roles: ["inspector"],
          permissions: ["exam.read"],
        },
      })),
    );
    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.actor.actorType).toBe("user");
      expect(result.actor.roles).toEqual(["inspector"]);
      expect(result.actor.permissions).toEqual(["exam.read"]);
    }
  });

  it("treats an empty /auth/me body as unauthenticated", async () => {
    const result = await liveSessionLoader(
      adapterWith(async () => ({ data: undefined })),
    );
    expect(result.status).toBe("unauthenticated");
  });

  it("maps a 401 ApiError to unauthenticated (not an error)", async () => {
    const result = await liveSessionLoader(
      adapterWith(async () => {
        throw new ApiError({
          status: 401,
          code: "UNAUTHORIZED",
          message: "missing token",
          url: "/api/identity-security/v1/auth/me",
        });
      }),
    );
    expect(result.status).toBe("unauthenticated");
  });

  it("rethrows a non-auth transport error (identity unavailable)", async () => {
    await expect(
      liveSessionLoader(
        adapterWith(async () => {
          throw new ApiError({
            status: 503,
            code: "SERVICE_DEGRADED",
            message: "identity unavailable",
            url: "/api/identity-security/v1/auth/me",
          });
        }),
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("mapSessionActor uses actorId as the display label fallback", () => {
    const actor = mapSessionActor({
      actorId: "id-1",
      actorType: "service",
      roles: [],
      permissions: [],
    });
    expect(actor.label).toBe("id-1");
    expect(actor.actorType).toBe("service");
  });
});
