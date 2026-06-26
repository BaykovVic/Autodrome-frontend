/**
 * Live Virtual Vehicle Scenario Catalog loader + DTO→view-model
 * mappers.
 *
 * Wires `/virtual-vehicles/scenarios` to the typed
 * `virtual-vehicle-service` client. Mock mode keeps using
 * fixtures.
 *
 * Coverage vs. canonical contract:
 *   - `GET /scenarios` → `liveVirtualVehicleScenariosLoader`.
 *   - `GET /scenarios/{scenarioId}` → `liveVirtualVehicleScenarioGet`.
 *
 * Canonical → view-model enum mapping:
 *   - `ScenarioSource` (`web|legacyLiteReplay|
 *     legacyFullTrajectory`) → `ConsoleScenarioSource`
 *     (`simulator|liteReplay|fullReplay`).
 *   - `CoordinateFrame` (`legacyXY|normalizedXY|geodeticWgs84`)
 *     → `ConsoleScenarioCoordinateFrame` (`local|world|geo|
 *     unknown`).
 *   - `YawProfile` (`liteDirectYaw|fullVehicleStateYaw|
 *     tcpGsofYaw|normalized`) → `ConsoleScenarioYawFrame`
 *     (`relative|absolute|compass|unknown`).
 *
 * `ConsoleScenarioStatus` (`draft|published|archived`) не
 * представлен в `SimulatorScenario` shape напрямую — backend
 * считает все returned scenarios published. Маппер ставит
 * `published` для всех canonical responses; `draft` /
 * `archived` останутся в mock fixtures, пока scenario lifecycle
 * не появится в контракте (tech debt).
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/virtual-vehicle";

import {
  SCENARIO_COORDINATE_FRAME_LABELS,
  SCENARIO_SOURCE_LABELS,
  SCENARIO_YAW_FRAME_LABELS,
  type ConsoleScenarioCoordinateFrame,
  type ConsoleScenarioSource,
  type ConsoleScenarioYawFrame,
  type ConsoleVirtualVehicleScenario,
  type ConsoleVirtualVehicleScenariosSnapshot,
} from "./consoleVirtualVehicleScenariosSnapshot";

type ScenarioDto = components["schemas"]["SimulatorScenario"];
type ScenariosPageDto =
  components["schemas"]["SimulatorScenariosPage"];
type ScenarioSourceDto = components["schemas"]["ScenarioSource"];
type CoordinateFrameDto = components["schemas"]["CoordinateFrame"];
type YawProfileDto = components["schemas"]["YawProfile"];

export function mapScenarioSourceDtoToConsole(
  dto: ScenarioSourceDto,
): ConsoleScenarioSource {
  switch (dto) {
    case "legacyLiteReplay":
      return "liteReplay";
    case "legacyFullTrajectory":
      return "fullReplay";
    case "web":
    default:
      return "simulator";
  }
}

export function mapCoordinateFrameDtoToConsole(
  dto: CoordinateFrameDto,
): ConsoleScenarioCoordinateFrame {
  switch (dto) {
    case "legacyXY":
      return "local";
    case "normalizedXY":
      return "world";
    case "geodeticWgs84":
      return "geo";
    default:
      return "unknown";
  }
}

export function mapYawProfileDtoToConsole(
  dto: YawProfileDto,
): ConsoleScenarioYawFrame {
  switch (dto) {
    case "normalized":
      return "relative";
    case "liteDirectYaw":
    case "fullVehicleStateYaw":
      return "absolute";
    case "tcpGsofYaw":
      return "compass";
    default:
      return "unknown";
  }
}

export function mapScenarioDtoToConsole(
  dto: ScenarioDto,
): ConsoleVirtualVehicleScenario {
  const source = mapScenarioSourceDtoToConsole(dto.source);
  const yawFrame = mapYawProfileDtoToConsole(dto.yawProfile);
  const coordinateFrame = mapCoordinateFrameDtoToConsole(dto.coordinateFrame);
  return {
    id: dto.scenarioId,
    code: dto.scenarioId,
    name: dto.name,
    description: `${dto.compatibilityProfile} · ${dto.type}`,
    source,
    sourceLabel: SCENARIO_SOURCE_LABELS[source],
    yawFrame,
    yawFrameLabel: SCENARIO_YAW_FRAME_LABELS[yawFrame],
    coordinateFrame,
    coordinateFrameLabel: SCENARIO_COORDINATE_FRAME_LABELS[coordinateFrame],
    status: "published",
    statusLabel: "Published",
    updatedAt: dto.updatedAt ?? dto.createdAt,
    version: "—",
  };
}

export async function liveVirtualVehicleScenariosLoader(
  adapter: AutodromeApi,
): Promise<ConsoleVirtualVehicleScenariosSnapshot> {
  const result = await adapter.virtualVehicle.GET("/scenarios", {});
  const page = (result.data ?? { items: [] }) as ScenariosPageDto;
  const scenarios = (page.items ?? []).map(mapScenarioDtoToConsole);
  return {
    totals: {
      total: scenarios.length,
      published: scenarios.filter((s) => s.status === "published").length,
      drafts: scenarios.filter((s) => s.status === "draft").length,
    },
    scenarios,
  };
}

export async function liveVirtualVehicleScenarioGet(
  adapter: AutodromeApi,
  scenarioId: string,
): Promise<ConsoleVirtualVehicleScenario> {
  const result = await adapter.virtualVehicle.GET(
    "/scenarios/{scenarioId}",
    {
      params: { path: { scenarioId } },
    },
  );
  const dto = result.data as ScenarioDto | undefined;
  if (!dto) {
    throw new Error(`Scenario "${scenarioId}" returned no body.`);
  }
  return mapScenarioDtoToConsole(dto);
}
