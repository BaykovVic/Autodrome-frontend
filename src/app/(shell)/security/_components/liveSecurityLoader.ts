/**
 * Live Security workspace loader.
 *
 * Canonical API Gateway BFF exposes the Web Console actor
 * context through `GET /me`. It verifies the bearer token
 * through identity-security and returns effective roles /
 * permissions in the same boundary used by the shell.
 *
 * Loader строит snapshot из BFF `GET /me` + всегда
 * рендерит canonical Role catalog (6 enum members) +
 * degradedNote объясняющий, что operator list shipped
 * с будущим backend feature.
 *
 * Failure → throws ApiError (hook surfaces degraded
 * surface).
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/api-gateway-bff";

import {
  ALL_SECURITY_ROLES,
  type ConsoleSecurityActor,
  type ConsoleSecurityActorType,
  type ConsoleSecurityRole,
  type ConsoleSecuritySnapshot,
} from "./consoleSecuritySnapshot";

type ActorDto = components["schemas"]["ActorContext"];
type RoleDto = string;
type ActorTypeDto = components["schemas"]["ActorContext"]["actorType"];

export function mapRoleDtoToConsole(dto: RoleDto): ConsoleSecurityRole {
  return dto as ConsoleSecurityRole;
}

export function mapActorTypeDtoToConsole(
  dto: ActorTypeDto,
): ConsoleSecurityActorType {
  return dto as ConsoleSecurityActorType;
}

export function mapActorDtoToConsole(
  dto: ActorDto,
): ConsoleSecurityActor {
  return {
    actorId: dto.actorId,
    actorType: mapActorTypeDtoToConsole(dto.actorType),
    label: dto.actorId,
    roles: (dto.roles ?? []).map(mapRoleDtoToConsole),
    permissions: dto.permissions ?? [],
  };
}

export async function liveSecurityLoader(
  adapter: AutodromeApi,
): Promise<ConsoleSecuritySnapshot> {
  const result = await adapter.apiGatewayBff.GET("/me", {});
  const actor = result.data as ActorDto | undefined;
  if (!actor) {
    return {
      currentActor: null,
      operators: [],
      roles: ALL_SECURITY_ROLES,
      degradedNote:
        "API Gateway BFF returned no body for /me.",
    };
  }
  const consoleActor = mapActorDtoToConsole(actor);
  return {
    currentActor: consoleActor,
    operators: [consoleActor],
    roles: ALL_SECURITY_ROLES,
    degradedNote:
      "API Gateway BFF exposes the current actor only. Operator list and role assignment ship with identity-security user-role endpoints.",
  };
}
