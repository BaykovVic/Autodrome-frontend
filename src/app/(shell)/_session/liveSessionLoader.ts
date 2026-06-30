/**
 * Live session loader.
 *
 * Resolves the current actor from canonical identity-security
 * `GET /auth/me`:
 *
 *   - 200 with actor body  → authenticated session.
 *   - 200 with empty body  → unauthenticated (no actor resolved).
 *   - 401 / 403            → unauthenticated (token missing/expired);
 *                            the API client throws `ApiError`, which
 *                            `classifyError` maps to `unauthorized`.
 *   - any other failure    → rethrown so the hook surfaces a transport
 *                            `error` phase rather than silently
 *                            signing the operator out.
 *
 * Backend RBAC remains the security boundary — the frontend only
 * reflects the actor the identity service returns.
 */

import type { AutodromeApi } from "@/api/adapter";
import { classifyError } from "@/api/error-taxonomy";
import type { components } from "@/contracts/types/identity-security";

import type {
  ConsoleSessionActor,
  ConsoleSessionActorType,
  ConsoleSessionResult,
  ConsoleSessionRole,
} from "./consoleSession";

type ActorDto = components["schemas"]["Actor"];
type RoleDto = components["schemas"]["Role"];
type ActorTypeDto = components["schemas"]["ActorType"];

export function mapSessionRole(dto: RoleDto): ConsoleSessionRole {
  return dto as ConsoleSessionRole;
}

export function mapSessionActorType(
  dto: ActorTypeDto,
): ConsoleSessionActorType {
  return dto as ConsoleSessionActorType;
}

export function mapSessionActor(dto: ActorDto): ConsoleSessionActor {
  return {
    actorId: dto.actorId,
    actorType: mapSessionActorType(dto.actorType),
    label: dto.actorId,
    roles: (dto.roles ?? []).map(mapSessionRole),
    permissions: dto.permissions ?? [],
  };
}

export async function liveSessionLoader(
  adapter: AutodromeApi,
): Promise<ConsoleSessionResult> {
  try {
    const result = await adapter.identitySecurity.GET("/auth/me", {});
    const actor = result.data as ActorDto | undefined;
    if (!actor) {
      return {
        status: "unauthenticated",
        reason: "Identity service returned no actor for /auth/me.",
      };
    }
    return { status: "authenticated", actor: mapSessionActor(actor) };
  } catch (error) {
    if (classifyError(error).category === "unauthorized") {
      return {
        status: "unauthenticated",
        reason:
          "Identity service rejected the session as unauthorized (401/403).",
      };
    }
    throw error;
  }
}
