/**
 * Live Security workspace loader.
 *
 * Canonical `identity-security-service` v1 exposes только
 * auth surface (`/auth/me`, login, refresh, logout,
 * introspect, device-tokens). Нет endpoint для list
 * users / list operators / assign role / revoke role.
 *
 * Loader строит snapshot из `GET /auth/me` + всегда
 * рендерит canonical Role catalog (6 enum members) +
 * degradedNote объясняющий, что operator list shipped
 * с будущим backend feature.
 *
 * Failure → throws ApiError (hook surfaces degraded
 * surface).
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/identity-security";

import {
  ALL_SECURITY_ROLES,
  type ConsoleSecurityActor,
  type ConsoleSecurityActorType,
  type ConsoleSecurityRole,
  type ConsoleSecuritySnapshot,
} from "./consoleSecuritySnapshot";

type ActorDto = components["schemas"]["Actor"];
type RoleDto = components["schemas"]["Role"];
type ActorTypeDto = components["schemas"]["ActorType"];

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
  const result = await adapter.identitySecurity.GET("/auth/me", {});
  const actor = result.data as ActorDto | undefined;
  if (!actor) {
    return {
      currentActor: null,
      operators: [],
      roles: ALL_SECURITY_ROLES,
      degradedNote:
        "Identity service returned no body for /auth/me.",
    };
  }
  const consoleActor = mapActorDtoToConsole(actor);
  return {
    currentActor: consoleActor,
    operators: [consoleActor],
    roles: ALL_SECURITY_ROLES,
    degradedNote:
      "Identity service exposes /auth/me only. Operator list and role assignment ship with future identity-security-service contracts (read-only view).",
  };
}
