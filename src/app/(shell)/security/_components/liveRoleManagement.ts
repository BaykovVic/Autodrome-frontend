/**
 * Live role management against canonical identity-security
 * user-role endpoints:
 *
 *   - `GET    /v1/users/{userId}/roles`            → list roles.
 *   - `POST   /v1/users/{userId}/roles`            → assign (idempotent).
 *   - `DELETE /v1/users/{userId}/roles/{roleKey}`  → revoke (idempotent).
 *
 * All three return the canonical `UserRolesResponse` (the resulting
 * role set), so assign/revoke are self-reconciling — the UI applies
 * the returned set rather than guessing. Errors bubble up as
 * `ApiError` (403 → forbidden, 404 → not-found, 422 → validation) and
 * are classified by the shared taxonomy at the call site. The
 * endpoints declare only a `Correlation-Id` header (auto-added by the
 * client) and are idempotent by contract, so no `Idempotency-Key` is
 * sent.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/identity-security";

import type { ConsoleSecurityRole } from "./consoleSecuritySnapshot";

type UserRolesResponseDto = components["schemas"]["UserRolesResponse"];
type RoleDto = components["schemas"]["Role"];

/** View-model shape of a user's canonical role set. */
export type UserRoles = {
  userId: string;
  roles: ConsoleSecurityRole[];
};

function mapUserRoles(dto: UserRolesResponseDto): UserRoles {
  return {
    userId: dto.userId,
    // Canonical `Role` enum is 1:1 with `ConsoleSecurityRole`.
    roles: (dto.roles ?? []).map((r) => r as ConsoleSecurityRole),
  };
}

export async function liveListUserRoles(
  adapter: AutodromeApi,
  userId: string,
): Promise<UserRoles> {
  const result = await adapter.identitySecurity.GET(
    "/v1/users/{userId}/roles",
    { params: { path: { userId } } },
  );
  const data = result.data as UserRolesResponseDto | undefined;
  if (!data) {
    throw new Error("User roles endpoint returned no body.");
  }
  return mapUserRoles(data);
}

export async function liveAssignRole(
  adapter: AutodromeApi,
  userId: string,
  role: ConsoleSecurityRole,
): Promise<UserRoles> {
  const result = await adapter.identitySecurity.POST(
    "/v1/users/{userId}/roles",
    {
      params: { path: { userId } },
      body: { role: role as RoleDto },
    },
  );
  const data = result.data as UserRolesResponseDto | undefined;
  if (!data) {
    throw new Error("Assign role endpoint returned no body.");
  }
  return mapUserRoles(data);
}

export async function liveRevokeRole(
  adapter: AutodromeApi,
  userId: string,
  role: ConsoleSecurityRole,
): Promise<UserRoles> {
  const result = await adapter.identitySecurity.DELETE(
    "/v1/users/{userId}/roles/{roleKey}",
    { params: { path: { userId, roleKey: role as RoleDto } } },
  );
  const data = result.data as UserRolesResponseDto | undefined;
  if (!data) {
    throw new Error("Revoke role endpoint returned no body.");
  }
  return mapUserRoles(data);
}
