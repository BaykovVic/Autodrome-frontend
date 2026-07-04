/**
 * Session token store (baseline).
 *
 * Holds the access/refresh token pair for the authenticated Web
 * Operator Console session. This baseline keeps tokens in memory —
 * they survive client-side navigation within a session.
 * `feature/frontend-token-session-storage-baseline` hardens this into
 * a persisted layer.
 *
 * Security: tokens must never be written to a URL, a log, a report or
 * a screenshot. This module exposes only in-process getters/setters.
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

/** Map the canonical `TokenPair` DTO to the session token view-model. */
export function tokensFromDto(dto: TokenPairDto): SessionTokens {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    expiresAt: dto.expiresAt,
    scopes: dto.scopes ?? [],
  };
}

let current: SessionTokens | null = null;

export function setSessionTokens(tokens: SessionTokens | null): void {
  current = tokens;
}

export function getSessionTokens(): SessionTokens | null {
  return current;
}

/** The bearer access token, or null when there is no session. */
export function getAccessToken(): string | null {
  return current?.accessToken ?? null;
}

export function clearSessionTokens(): void {
  current = null;
}
