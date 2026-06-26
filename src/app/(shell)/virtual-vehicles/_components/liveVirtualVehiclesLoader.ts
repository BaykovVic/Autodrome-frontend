/**
 * Live Virtual Vehicles workspace loader + DTO→view-model
 * mappers.
 *
 * Wires `/virtual-vehicles` workspace to the typed
 * `virtual-vehicle-service` client. Mock mode keeps using
 * fixtures — this module runs only when
 * `resolveRuntimeMode() === "live"`.
 *
 * Coverage vs. canonical contract
 * (`@/contracts/types/virtual-vehicle`):
 *   - `GET /virtual-vehicles` → `liveVirtualVehiclesLoader`.
 *   - `GET /virtual-vehicles/{virtualVehicleId}` →
 *     `liveVirtualVehicleGet`.
 *
 * Mapper translates the canonical enums into the operator
 * view-model vocabulary established for the workspace
 * baseline:
 *
 *   - `VirtualVehicleStatus` (`draft|ready|running|paused|
 *     stopped|failed`) → `ConsoleVirtualVehicleStatus`
 *     (`idle|running|paused|stopped|degraded`). `draft` и
 *     `ready` collapse в `idle` потому что operator не
 *     различает «no scenario» vs «scenario attached, idle»
 *     на табличной поверхности. `failed` → `degraded`.
 *   - `SimulatorSource` (`webVirtual|rpiHardware|
 *     importedLegacy`) → `ConsoleVirtualVehicleSource`
 *     (`simulator|legacyReplay|operatorManual`).
 *     `webVirtual` → `simulator`; `importedLegacy` →
 *     `legacyReplay`; `rpiHardware` → `simulator` (closest
 *     fit).
 *
 * Backend lag: any non-2xx response throws `ApiError` через
 * shared middleware; hook layer surfaces degraded state
 * через `<ApiErrorView>`.
 *
 * Tech debt:
 *   - `scenarioLabel` ставится в `scenarioId` пока scenario
 *     catalog resolution не подключён в той же сессии (живёт
 *     отдельным roundtrip к `/scenarios/{id}` или клиентским
 *     кешем). Сейчас operator видит canonical id вместо
 *     human label при `scenarioLabel === scenarioId`.
 *   - `startedAt` для running session недоступен в
 *     `/virtual-vehicles` payload — backend возвращает
 *     `currentSessionId` без timestamp; полная hydratation
 *     произойдёт в `frontend-virtual-vehicle-telemetry-live-
 *     binding`, когда session monitor станет live.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/virtual-vehicle";

import {
  VIRTUAL_VEHICLE_SOURCE_LABELS,
  VIRTUAL_VEHICLE_STATUS_LABELS,
  type ConsoleVirtualVehicle,
  type ConsoleVirtualVehicleSource,
  type ConsoleVirtualVehicleStatus,
  type ConsoleVirtualVehiclesSnapshot,
} from "./consoleVirtualVehiclesSnapshot";

type VirtualVehicleDto = components["schemas"]["VirtualVehicle"];
type VirtualVehiclesPageDto =
  components["schemas"]["VirtualVehiclesPage"];
type VirtualVehicleStatusDto =
  components["schemas"]["VirtualVehicleStatus"];
type SimulatorSourceDto = components["schemas"]["SimulatorSource"];

export function mapVirtualVehicleStatusDtoToConsole(
  dto: VirtualVehicleStatusDto,
): ConsoleVirtualVehicleStatus {
  switch (dto) {
    case "running":
      return "running";
    case "paused":
      return "paused";
    case "stopped":
      return "stopped";
    case "failed":
      return "degraded";
    case "draft":
    case "ready":
    default:
      return "idle";
  }
}

export function mapSimulatorSourceDtoToConsole(
  dto: SimulatorSourceDto,
): ConsoleVirtualVehicleSource {
  switch (dto) {
    case "importedLegacy":
      return "legacyReplay";
    case "rpiHardware":
    case "webVirtual":
    default:
      return "simulator";
  }
}

export function mapVirtualVehicleDtoToConsole(
  dto: VirtualVehicleDto,
): ConsoleVirtualVehicle {
  const status = mapVirtualVehicleStatusDtoToConsole(dto.status);
  const source = mapSimulatorSourceDtoToConsole(dto.simulatorSource);
  const scenarioId = dto.currentScenarioId ?? "—";
  return {
    id: dto.virtualVehicleId,
    label: dto.displayName,
    status,
    statusLabel: VIRTUAL_VEHICLE_STATUS_LABELS[status],
    source,
    sourceLabel: VIRTUAL_VEHICLE_SOURCE_LABELS[source],
    scenarioId,
    scenarioLabel: scenarioId,
    startedAt: dto.updatedAt ?? dto.createdAt,
    lastTelemetryAt: dto.updatedAt ?? dto.createdAt,
  };
}

function countByStatus(
  vehicles: readonly ConsoleVirtualVehicle[],
  target: ConsoleVirtualVehicleStatus,
): number {
  return vehicles.filter((v) => v.status === target).length;
}

export async function liveVirtualVehiclesLoader(
  adapter: AutodromeApi,
): Promise<ConsoleVirtualVehiclesSnapshot> {
  const result = await adapter.virtualVehicle.GET("/virtual-vehicles", {});
  const page = (result.data ?? { items: [] }) as VirtualVehiclesPageDto;
  const vehicles = (page.items ?? []).map(mapVirtualVehicleDtoToConsole);
  return {
    totals: {
      total: vehicles.length,
      running: countByStatus(vehicles, "running"),
      idle: countByStatus(vehicles, "idle"),
      degraded: countByStatus(vehicles, "degraded"),
    },
    vehicles,
  };
}

export async function liveVirtualVehicleGet(
  adapter: AutodromeApi,
  virtualVehicleId: string,
): Promise<ConsoleVirtualVehicle> {
  const result = await adapter.virtualVehicle.GET(
    "/virtual-vehicles/{virtualVehicleId}",
    {
      params: { path: { virtualVehicleId } },
    },
  );
  const dto = result.data as VirtualVehicleDto | undefined;
  if (!dto) {
    throw new Error(
      `Virtual vehicle "${virtualVehicleId}" returned no body.`,
    );
  }
  return mapVirtualVehicleDtoToConsole(dto);
}
