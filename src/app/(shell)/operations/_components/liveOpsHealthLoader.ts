/**
 * Live operations health loader.
 *
 * Wires the service-health dashboard to canonical
 * `deployment-operations-service` aggregator
 * `GET /ops/health`. Mock fallback preserved через
 * existing `defaultServiceHealthLoader`.
 *
 * Mapping:
 *   - `HealthStatus.components[]` (component + status
 *     `healthy|degraded|offline|unknown`) → 1 console
 *     entry per component.
 *   - Aggregator does not split liveness vs readiness:
 *     we surface both as the same canonical status
 *     (operator gets honest single signal, не invented
 *     readiness probe).
 *   - `checkedAt` ISO timestamp идёт в `lastCheckAt`.
 *   - `status` enum `offline` маппится в frontend
 *     `down` (existing canonical token).
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/deployment-operations";

import type {
  ServiceHealth,
  ServiceHealthStatus,
} from "./serviceHealth";

type HealthStatusDto =
  components["schemas"]["HealthStatus"];
type HealthComponentDto =
  components["schemas"]["HealthComponent"];
type HealthBackendStatus = HealthComponentDto["status"];

export function mapBackendStatusToConsole(
  s: HealthBackendStatus,
): ServiceHealthStatus {
  switch (s) {
    case "healthy":
      return "healthy";
    case "degraded":
      return "degraded";
    case "offline":
      return "down";
    case "unknown":
    default:
      return "unknown";
  }
}

export function mapHealthStatusDtoToConsole(
  dto: HealthStatusDto,
): ServiceHealth[] {
  return (dto.components ?? []).map((c: HealthComponentDto) => {
    const status = mapBackendStatusToConsole(c.status);
    return {
      id: c.component,
      name: c.component,
      kind: "backend" as const,
      liveness: status,
      readiness: status,
      lastCheckAt: dto.checkedAt,
    };
  });
}

export async function liveOpsHealthLoader(
  adapter: AutodromeApi,
): Promise<ServiceHealth[]> {
  const result = await adapter.deploymentOperations.GET(
    "/ops/health",
    {},
  );
  const dto = result.data as HealthStatusDto | undefined;
  if (!dto) {
    throw new Error("Ops health endpoint returned no body.");
  }
  return mapHealthStatusDtoToConsole(dto);
}
