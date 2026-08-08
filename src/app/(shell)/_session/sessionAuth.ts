/**
 * Session refresh + logout lifecycle over canonical identity-security
 * endpoints:
 *
 *   - `POST /auth/refresh` — rotate the refresh token for a fresh pair
 *     (not idempotent; no Idempotency-Key).
 *   - `POST /auth/logout`  — revoke the refresh token / session (204,
 *     idempotent).
 *
 * `liveSessionWithRefresh` transparently refreshes an expired access
 * token before / around the BFF `/me` call. Refresh is bounded — at
 * most one refresh + one retry per resolve — so an unrefreshable
 * session ends in a predictable `unauthenticated` state instead of
 * looping. A 403 is never treated here (that stays a forbidden state
 * via `liveSessionLoader`); refresh only reacts to 401/expiry.
 */

import type { AutodromeApi } from "@/api/adapter";
import {
  clearSessionTokens,
  getSessionTokens,
  isAccessTokenExpired,
  setSessionTokens,
  tokensFromDto,
  type SessionTokens,
} from "@/api/session-tokens";
import type { components } from "@/contracts/types/identity-security";

import type { ConsoleSessionResult } from "./consoleSession";
import { liveSessionLoader } from "./liveSessionLoader";

type TokenPairDto = components["schemas"]["TokenPair"];

export async function liveRefresh(
  adapter: AutodromeApi,
  refreshToken: string,
): Promise<SessionTokens> {
  const result = await adapter.identitySecurity.POST("/auth/refresh", {
    body: { refreshToken },
  });
  const data = result.data as TokenPairDto | undefined;
  if (!data) {
    throw new Error("Refresh endpoint returned no token pair.");
  }
  return tokensFromDto(data);
}

export async function liveLogout(
  adapter: AutodromeApi,
  refreshToken: string,
): Promise<void> {
  // 204 No Content on success; idempotent on an already-revoked token.
  await adapter.identitySecurity.POST("/auth/logout", {
    body: { refreshToken },
  });
}

/**
 * Best-effort logout: revoke the refresh token server-side (ignored on
 * failure — the local session is cleared regardless) and clear the
 * stored session. Never throws.
 */
export async function performLogout(adapter: AutodromeApi): Promise<void> {
  const tokens = getSessionTokens();
  if (tokens?.refreshToken) {
    try {
      await liveLogout(adapter, tokens.refreshToken);
    } catch {
      // Server revoke is best-effort; local clear below is authoritative.
    }
  }
  clearSessionTokens();
}

export type SessionRefreshDeps = {
  now: () => number;
  refresh: (
    adapter: AutodromeApi,
    refreshToken: string,
  ) => Promise<SessionTokens>;
  load: (adapter: AutodromeApi) => Promise<ConsoleSessionResult>;
};

const DEFAULT_DEPS: SessionRefreshDeps = {
  now: () => Date.now(),
  refresh: liveRefresh,
  load: liveSessionLoader,
};

const EXPIRED_RESULT: ConsoleSessionResult = {
  status: "unauthenticated",
  reason: "Session expired and could not be refreshed. Sign in again.",
};

async function applyRefresh(
  adapter: AutodromeApi,
  refreshToken: string,
  refresh: SessionRefreshDeps["refresh"],
): Promise<boolean> {
  try {
    setSessionTokens(await refresh(adapter, refreshToken));
    return true;
  } catch {
    clearSessionTokens();
    return false;
  }
}

/**
 * Resolve the live session, refreshing an expired/rejected access
 * token when a refresh token is available. Bounded to one refresh +
 * one retry so it can never loop.
 */
export async function liveSessionWithRefresh(
  adapter: AutodromeApi,
  deps: Partial<SessionRefreshDeps> = {},
): Promise<ConsoleSessionResult> {
  const { now, refresh, load } = { ...DEFAULT_DEPS, ...deps };
  const tokens = getSessionTokens();
  let refreshed = false;

  // Proactive: a locally-expired access token is refreshed before /me.
  if (tokens?.refreshToken && isAccessTokenExpired(tokens, now())) {
    refreshed = true;
    if (!(await applyRefresh(adapter, tokens.refreshToken, refresh))) {
      return EXPIRED_RESULT;
    }
  }

  const result = await load(adapter);

  // Reactive: /me came back unauthenticated (server-side revocation /
  // expiry) but a refresh token is still present and we have not
  // refreshed yet → one refresh + one retry.
  if (result.status === "unauthenticated" && !refreshed) {
    const current = getSessionTokens();
    if (current?.refreshToken) {
      if (await applyRefresh(adapter, current.refreshToken, refresh)) {
        return load(adapter);
      }
      return EXPIRED_RESULT;
    }
  }

  return result;
}
