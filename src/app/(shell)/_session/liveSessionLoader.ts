/**
 * Live session loader.
 *
 * Resolves the current actor from API Gateway BFF `GET /me`.
 * BFF is the Web Console actor-context boundary: it verifies the
 * token through identity-security and returns effective roles /
 * permissions in the shape the shell consumes.
 *
 *   - 200 with actor body  → authenticated session.
 *   - 200 with empty body  → unauthenticated (no actor resolved).
 *   - 401                  → unauthenticated (token missing/expired):
 *                            the API client throws `ApiError`,
 *                            `classifyError` maps 401 to `unauthorized`,
 *                            and the shell shows the session / sign-in
 *                            state.
 *   - 403                  → rethrown, NOT unauthenticated. `classifyError`
 *                            maps 403 to `forbidden` (not `unauthorized`),
 *                            so the session stays and the shell renders a
 *                            forbidden panel. A 403 must never trigger a
 *                            refresh or logout.
 *   - any other failure    → rethrown so the hook surfaces a transport
 *                            `error` phase rather than silently
 *                            signing the operator out.
 *
 * Backend RBAC remains the security boundary — the frontend only
 * reflects the actor the BFF returns.
 */

import type { AutodromeApi } from "@/api/adapter";
import { classifyError } from "@/api/error-taxonomy";
import type { components } from "@/contracts/types/api-gateway-bff";

import type {
  ConsoleSessionActor,
  ConsoleSessionActorType,
  ConsoleSessionResult,
  ConsoleSessionRole,
} from "./consoleSession";

type ActorDto = components["schemas"]["ActorContext"];
type RoleDto = string;
type ActorTypeDto = components["schemas"]["ActorContext"]["actorType"];

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
    roles: dto.roles.map(mapSessionRole),
    permissions: dto.permissions ?? [],
  };
}

export async function liveSessionLoader(
  adapter: AutodromeApi,
): Promise<ConsoleSessionResult> {
  try {
    const result = await adapter.apiGatewayBff.GET("/me", {});
    const actor = result.data as ActorDto | undefined;
    if (!actor) {
      return {
        status: "unauthenticated",
        reason: "API Gateway BFF returned no actor for /me.",
      };
    }
    return { status: "authenticated", actor: mapSessionActor(actor) };
  } catch (error) {
    if (classifyError(error).category === "unauthorized") {
      return {
        status: "unauthenticated",
        reason:
          "API Gateway BFF rejected the session as unauthorized (401/403).",
      };
    }
    throw error;
  }
}
