import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import {
  clearSessionTokens,
  getSessionTokens,
  setSessionTokens,
  type SessionTokens,
} from "@/api/session-tokens";
import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import {
  liveLogout,
  liveRefresh,
  liveSessionWithRefresh,
  performLogout,
} from "@/app/(shell)/_session/sessionAuth";

const NOW = Date.parse("2026-01-01T00:00:00Z");
const EXPIRED = "2025-01-01T00:00:00Z";
const VALID = "2099-01-01T00:00:00Z";

function tokens(expiresAt: string, refresh = "r"): SessionTokens {
  return { accessToken: "a", refreshToken: refresh, expiresAt, scopes: [] };
}

function adapter(handlers: Record<string, unknown>): AutodromeApi {
  return { identitySecurity: handlers } as unknown as AutodromeApi;
}

beforeEach(() => {
  clearSessionTokens();
  window.localStorage.clear();
});

describe("liveRefresh / liveLogout", () => {
  it("refresh posts the refresh token and maps the new pair", async () => {
    const POST = vi.fn(async () => ({
      data: {
        accessToken: "a2",
        refreshToken: "r2",
        expiresAt: "t",
        scopes: ["s"],
      },
    }));
    const res = await liveRefresh(adapter({ POST }), "r1");
    expect(POST).toHaveBeenCalledWith("/auth/refresh", {
      body: { refreshToken: "r1" },
    });
    expect(res.accessToken).toBe("a2");
    expect(res.refreshToken).toBe("r2");
  });

  it("logout posts the refresh token (204, no body)", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    await liveLogout(adapter({ POST }), "r1");
    expect(POST).toHaveBeenCalledWith("/auth/logout", {
      body: { refreshToken: "r1" },
    });
  });
});

describe("performLogout", () => {
  it("revokes the refresh token and clears the session", async () => {
    setSessionTokens(tokens(VALID));
    const POST = vi.fn(async () => ({ data: undefined }));
    await performLogout(adapter({ POST }));
    expect(POST).toHaveBeenCalledWith("/auth/logout", {
      body: { refreshToken: "r" },
    });
    expect(getSessionTokens()).toBeNull();
  });

  it("clears the session even when the server logout fails", async () => {
    setSessionTokens(tokens(VALID));
    const POST = vi.fn(async () => {
      throw new ApiError({ status: 500, code: "X", message: "x", url: "/x" });
    });
    await performLogout(adapter({ POST }));
    expect(getSessionTokens()).toBeNull();
  });

  it("skips the server call without a refresh token but still clears", async () => {
    const POST = vi.fn();
    await performLogout(adapter({ POST }));
    expect(POST).not.toHaveBeenCalled();
    expect(getSessionTokens()).toBeNull();
  });
});

describe("liveSessionWithRefresh", () => {
  const authed: ConsoleSessionResult = {
    status: "authenticated",
    actor: {
      actorId: "a",
      actorType: "user",
      label: "A",
      roles: [],
      permissions: [],
    },
  };
  const unauth: ConsoleSessionResult = { status: "unauthenticated" };
  const api = {} as AutodromeApi;

  it("refreshes proactively when the access token is locally expired", async () => {
    setSessionTokens(tokens(EXPIRED));
    const refresh = vi.fn(async () => tokens(VALID, "r2"));
    const load = vi.fn(async () => authed);
    const res = await liveSessionWithRefresh(api, {
      now: () => NOW,
      refresh,
      load,
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(getSessionTokens()?.refreshToken).toBe("r2");
    expect(res.status).toBe("authenticated");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the access token is still valid", async () => {
    setSessionTokens(tokens(VALID));
    const refresh = vi.fn();
    const load = vi.fn(async () => authed);
    await liveSessionWithRefresh(api, { now: () => NOW, refresh, load });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("reactively refreshes + retries once on an unauthenticated /me", async () => {
    setSessionTokens(tokens(VALID)); // valid → no proactive refresh
    const refresh = vi.fn(async () => tokens(VALID, "r2"));
    const load = vi
      .fn<() => Promise<ConsoleSessionResult>>()
      .mockResolvedValueOnce(unauth)
      .mockResolvedValueOnce(authed);
    const res = await liveSessionWithRefresh(api, {
      now: () => NOW,
      refresh,
      load,
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(2);
    expect(res.status).toBe("authenticated");
  });

  it("ends unauthenticated with no loop when refresh fails", async () => {
    setSessionTokens(tokens(EXPIRED));
    const refresh = vi.fn(async () => {
      throw new ApiError({ status: 401, code: "X", message: "x", url: "/x" });
    });
    const load = vi.fn(async () => authed);
    const res = await liveSessionWithRefresh(api, {
      now: () => NOW,
      refresh,
      load,
    });
    expect(res.status).toBe("unauthenticated");
    expect(load).not.toHaveBeenCalled();
    expect(getSessionTokens()).toBeNull();
  });

  it("stays unauthenticated without refreshing when there is no token", async () => {
    const refresh = vi.fn();
    const load = vi.fn(async () => unauth);
    const res = await liveSessionWithRefresh(api, {
      now: () => NOW,
      refresh,
      load,
    });
    expect(refresh).not.toHaveBeenCalled();
    expect(res.status).toBe("unauthenticated");
  });
});
