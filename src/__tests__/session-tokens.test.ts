import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSessionTokens,
  getAccessToken,
  getSessionTokens,
  setSessionTokens,
  tokensFromDto,
} from "@/api/session-tokens";

beforeEach(() => clearSessionTokens());

describe("session-tokens store", () => {
  it("stores and returns the token pair", () => {
    setSessionTokens({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: "2026-01-01T00:00:00Z",
      scopes: ["x"],
    });
    expect(getAccessToken()).toBe("a");
    expect(getSessionTokens()?.refreshToken).toBe("r");
  });

  it("clears the session", () => {
    setSessionTokens({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: "t",
      scopes: [],
    });
    clearSessionTokens();
    expect(getSessionTokens()).toBeNull();
    expect(getAccessToken()).toBeNull();
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
