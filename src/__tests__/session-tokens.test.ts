import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSessionTokens,
  getAccessToken,
  getSessionTokens,
  hasValidSession,
  isAccessTokenExpired,
  setSessionTokens,
  tokensFromDto,
  type SessionTokens,
} from "@/api/session-tokens";

const STORAGE_KEY = "autodrome.session.tokens.v1";

const SAMPLE: SessionTokens = {
  accessToken: "a",
  refreshToken: "r",
  expiresAt: "2026-01-01T00:00:00Z",
  scopes: ["operator"],
};

beforeEach(() => {
  clearSessionTokens();
  window.localStorage.clear();
});

describe("session-tokens store", () => {
  it("stores and returns the token pair", () => {
    setSessionTokens(SAMPLE);
    expect(getAccessToken()).toBe("a");
    expect(getSessionTokens()?.refreshToken).toBe("r");
  });

  it("persists to localStorage so the session survives a reload", () => {
    setSessionTokens(SAMPLE);
    // Persisted under the versioned key...
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    // ...and a fresh read (as after a reload) reconstructs it.
    expect(getSessionTokens()).toEqual(SAMPLE);
  });

  it("clears the persisted session on logout", () => {
    setSessionTokens(SAMPLE);
    clearSessionTokens();
    expect(getSessionTokens()).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("drops a corrupt / foreign stored value instead of surfacing it", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json");
    expect(getSessionTokens()).toBeNull();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }));
    expect(getSessionTokens()).toBeNull();
  });

  it("maps the canonical TokenPair dto", () => {
    expect(
      tokensFromDto({
        accessToken: "a",
        refreshToken: "r",
        expiresAt: "t",
        scopes: ["s"],
      }),
    ).toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: "t",
      scopes: ["s"],
    });
  });
});

describe("token expiry", () => {
  const EXP = Date.parse("2026-01-01T00:00:00Z");

  it("is expired when now is at/after expiresAt (and for missing tokens)", () => {
    expect(isAccessTokenExpired(SAMPLE, EXP - 1000)).toBe(false);
    expect(isAccessTokenExpired(SAMPLE, EXP)).toBe(true);
    expect(isAccessTokenExpired(SAMPLE, EXP + 1000)).toBe(true);
    expect(isAccessTokenExpired(null, EXP - 1000)).toBe(true);
  });

  it("treats an unparseable expiresAt as expired", () => {
    expect(
      isAccessTokenExpired({ ...SAMPLE, expiresAt: "not-a-date" }, EXP - 1000),
    ).toBe(true);
  });

  it("applies skew to expire early", () => {
    expect(isAccessTokenExpired(SAMPLE, EXP - 1000, 2000)).toBe(true);
  });

  it("hasValidSession reflects the stored token", () => {
    expect(hasValidSession(EXP - 1000)).toBe(false); // no session
    setSessionTokens(SAMPLE);
    expect(hasValidSession(EXP - 1000)).toBe(true);
    expect(hasValidSession(EXP + 1000)).toBe(false);
  });
});
