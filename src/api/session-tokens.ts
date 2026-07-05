/**
 * Session token store.
 *
 * Holds the access/refresh token pair (+ expiry metadata) for the
 * authenticated Web Operator Console session and persists it so the
 * session survives a full page reload.
 *
 * Storage baseline (pilot): the token pair is kept in `localStorage`.
 * XSS caveat — anything able to run script in the origin can read
 * `localStorage`, so this is a pilot-stand baseline, not a hardened
 * production choice. A production build should move the session to an
 * httpOnly, SameSite cookie issued by the BFF (or a BFF-side session)
 * so the browser never holds a readable bearer. When `localStorage`
 * is unavailable (SSR, private mode, disabled), the store falls back
 * to in-memory, which still works for a single client session.
 *
 * Security invariants: tokens are never written to a URL, a log, a
 * report or a screenshot. This module exposes only in-process
 * getters/setters.
 */

import type { components } from "@/contracts/types/identity-security";

type TokenPairDto = components["schemas"]["TokenPair"];

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  /** ISO-8601 UTC expiry of the access token. */
  expiresAt: string;
  scopes: string[];
};

const STORAGE_KEY = "autodrome.session.tokens.v1";

/** Map the canonical `TokenPair` DTO to the session token view-model. */
export function tokensFromDto(dto: TokenPairDto): SessionTokens {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    expiresAt: dto.expiresAt,
    scopes: dto.scopes ?? [],
  };
}

function isSessionTokens(value: unknown): value is SessionTokens {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.accessToken === "string" &&
    typeof o.refreshToken === "string" &&
    typeof o.expiresAt === "string" &&
    Array.isArray(o.scopes)
  );
}

/**
 * Returns a usable `localStorage`, or null when it is unavailable or
 * throws (SSR, private mode, storage disabled). Probed defensively so
 * a throwing `localStorage` never crashes the app.
 */
function browserStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const probe = "__autodrome_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

// Fallback when no persistent storage is available (SSR / private mode).
let memoryFallback: SessionTokens | null = null;

export function setSessionTokens(tokens: SessionTokens | null): void {
  const storage = browserStorage();
  if (storage) {
    try {
      if (tokens) {
        storage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      } else {
        storage.removeItem(STORAGE_KEY);
      }
      return;
    } catch {
      // fall through to memory on quota / serialization failure
    }
  }
  memoryFallback = tokens;
}

export function getSessionTokens(): SessionTokens | null {
  const storage = browserStorage();
  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (isSessionTokens(parsed)) return parsed;
      // Corrupt/foreign value → drop it rather than surface garbage.
      storage.removeItem(STORAGE_KEY);
      return null;
    } catch {
      return null;
    }
  }
  return memoryFallback;
}

/** The bearer access token, or null when there is no session. */
export function getAccessToken(): string | null {
  return getSessionTokens()?.accessToken ?? null;
}

/** Logout cleanup — removes the persisted (and in-memory) session. */
export function clearSessionTokens(): void {
  setSessionTokens(null);
}

/**
 * True when there is no session or the access token is at/past its
 * expiry. An unparseable `expiresAt` is treated as expired so a
 * malformed token never counts as valid. `skewMs` lets a caller
 * treat a token as expired slightly early (clock skew / refresh
 * lead time).
 */
export function isAccessTokenExpired(
  tokens: SessionTokens | null,
  nowMs: number,
  skewMs = 0,
): boolean {
  if (!tokens) return true;
  const expiryMs = Date.parse(tokens.expiresAt);
  if (Number.isNaN(expiryMs)) return true;
  return nowMs + skewMs >= expiryMs;
}

/** A usable session = tokens present and not (near-)expired. */
export function hasValidSession(nowMs: number, skewMs = 0): boolean {
  return !isAccessTokenExpired(getSessionTokens(), nowMs, skewMs);
}
