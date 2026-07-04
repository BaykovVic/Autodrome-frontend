/**
 * Live login against the canonical public identity endpoint
 * `POST /auth/login` (no bearer required). Returns the mapped session
 * token pair; errors bubble up as `ApiError` (401 invalid credentials,
 * 422 validation, 5xx) for the screen to classify.
 */

import type { AutodromeApi } from "@/api/adapter";
import {
  tokensFromDto,
  type SessionTokens,
} from "@/api/session-tokens";
import type { components } from "@/contracts/types/identity-security";

type TokenPairDto = components["schemas"]["TokenPair"];

export type LoginCredentials = {
  login: string;
  password: string;
};

export async function liveLogin(
  adapter: AutodromeApi,
  credentials: LoginCredentials,
): Promise<SessionTokens> {
  const result = await adapter.identitySecurity.POST("/auth/login", {
    body: credentials,
  });
  const data = result.data as TokenPairDto | undefined;
  if (!data) {
    throw new Error("Login endpoint returned no token pair.");
  }
  return tokensFromDto(data);
}
