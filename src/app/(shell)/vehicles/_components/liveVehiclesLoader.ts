/**
 * Live vehicles loader + DTO→view-model mapper.
 *
 * Wires the vehicles registry screen to the typed
 * `vehicle-service` client (`api.vehicle.GET("/vehicles")`). Mock
 * mode keeps using the scenario fixtures — this loader runs only
 * when `resolveRuntimeMode() === "live"`.
 *
 * Mapping notes:
 *
 *   - Canonical `Vehicle` DTO carries identity, type, model, status
 *     and optional `boundEdgeGateway` / `boundDevice` refs. The
 *     registry surface adds design-only blocks (equipment-health
 *     table, last-seen telemetry timestamp, firmware version) that
 *     do not yet have a canonical owner. Until that contract ships,
 *     the mapper assigns safe defaults so the live screen renders
 *     without inventing telemetry numbers.
 *
 *   - `vehicle.type` maps to a category chip per the operator
 *     convention (`Cat A/B/C/D`) instead of leaking the DTO enum
 *     into the visual surface.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/vehicle";

import type {
  ConsoleVehicle,
  ConsoleVehiclesSnapshot,
  VehicleDeviceState,
} from "./consoleRegistrySnapshot";

type VehicleDto = components["schemas"]["Vehicle"];
type VehicleType = components["schemas"]["VehicleType"];

const CATEGORY_FOR_TYPE: Record<VehicleType, string> = {
  passenger: "Cat B",
  truck: "Cat C",
  motorcycle: "Cat A",
  bus: "Cat D",
};

export function vehicleDeviceState(dto: VehicleDto): {
  state: VehicleDeviceState;
  label: string;
} {
  if (dto.status === "decommissioned") {
    return { state: "offline", label: "decommissioned" };
  }
  if (dto.status === "maintenance") {
    return { state: "degraded", label: "maintenance" };
  }
  const hasGateway = Boolean(dto.boundEdgeGateway);
  const hasDevice = Boolean(dto.boundDevice);
  if (hasGateway && hasDevice) {
    return { state: "online", label: "online · device bound" };
  }
  if (hasGateway || hasDevice) {
    return { state: "degraded", label: "partial binding" };
  }
  return { state: "standby", label: "no device bound" };
}

export function mapVehicleDtoToConsole(dto: VehicleDto): ConsoleVehicle {
  const device = vehicleDeviceState(dto);
  return {
    id: dto.vehicleId,
    model: dto.model,
    plate: dto.plateNumber,
    category: CATEGORY_FOR_TYPE[dto.type] ?? "—",
    device,
    firmware: "—",
    lastSeen: dto.updatedAt ?? dto.statusChangedAt ?? dto.createdAt,
    equipment: [],
  };
}

function countByDeviceState(
  vehicles: readonly ConsoleVehicle[],
  target: VehicleDeviceState,
): number {
  return vehicles.filter((v) => v.device.state === target).length;
}

/**
 * Calls `GET /vehicles` via the supplied adapter and maps the
 * response into a `ConsoleVehiclesSnapshot`. The shared
 * `createAutodromeClient` middleware throws an `ApiError` on any
 * non-2xx response, so the hook layer surfaces that via
 * `classifyError()` and the existing degraded/error UI primitives.
 */
export async function liveVehiclesLoader(
  adapter: AutodromeApi,
): Promise<ConsoleVehiclesSnapshot> {
  const result = await adapter.vehicle.GET("/vehicles", {});
  const page = (result.data ?? { items: [] }) as {
    items?: VehicleDto[];
  };
  const vehicles = (page.items ?? []).map(mapVehicleDtoToConsole);
  return {
    totals: {
      total: vehicles.length,
      degraded: countByDeviceState(vehicles, "degraded"),
      offline: countByDeviceState(vehicles, "offline"),
    },
    vehicles,
  };
}
