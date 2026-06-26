/**
 * Console-shaped scenario catalog snapshot.
 *
 * Scenario catalog feeds the Virtual Vehicles workspace: an
 * operator picks a scenario when spawning a virtual session.
 * Each scenario carries source + coordinate-frame + yaw-frame
 * metadata so operators can tell apart legacy Lite vs Full
 * trajectory imports без opening a raw protocol editor (per spec
 * rule "No raw protocol editor").
 *
 * Canonical names mirror the planned
 * `virtual-vehicle-service-scenario-catalog-baseline` shape so
 * Track 3 live API integration drops in без restructuring the
 * view-model.
 *
 * Source enum values (`liteReplay` / `fullReplay` / `simulator`)
 * stay canonical; operator-friendly labels live в lookup map
 * applied at render only.
 */

export type ConsoleScenarioSource =
  | "simulator"
  | "liteReplay"
  | "fullReplay";

export type ConsoleScenarioYawFrame =
  | "relative"
  | "absolute"
  | "compass"
  | "unknown";

export type ConsoleScenarioCoordinateFrame =
  | "local"
  | "world"
  | "geo"
  | "unknown";

export type ConsoleScenarioStatus = "draft" | "published" | "archived";

export type ConsoleVirtualVehicleScenario = {
  id: string;
  /** Operator-facing short code, e.g. `SC-CITY-A`. */
  code: string;
  /** Human-friendly name. */
  name: string;
  description: string;
  source: ConsoleScenarioSource;
  sourceLabel: string;
  yawFrame: ConsoleScenarioYawFrame;
  yawFrameLabel: string;
  coordinateFrame: ConsoleScenarioCoordinateFrame;
  coordinateFrameLabel: string;
  status: ConsoleScenarioStatus;
  statusLabel: string;
  /** Last published / updated timestamp (ISO) or `"—"`. */
  updatedAt: string;
  /** Catalog version label (e.g. `v3`) or `"—"`. */
  version: string;
};

export type ConsoleVirtualVehicleScenariosSnapshot = {
  totals: {
    total: number;
    published: number;
    drafts: number;
  };
  scenarios: ConsoleVirtualVehicleScenario[];
};

/**
 * Operator-friendly labels. Legacy Lite (`liteReplay`) vs Full
 * (`fullReplay`) распознаются явно — operator должен знать,
 * шипует ли scenario сжатую "lite" телеметрию или full-fidelity
 * trajectory, потому что live binding behaviour отличается.
 */
export const SCENARIO_SOURCE_LABELS: Record<
  ConsoleScenarioSource,
  string
> = {
  simulator: "Simulator",
  liteReplay: "Legacy Lite replay",
  fullReplay: "Legacy Full replay",
};

export const SCENARIO_YAW_FRAME_LABELS: Record<
  ConsoleScenarioYawFrame,
  string
> = {
  relative: "Relative",
  absolute: "Absolute",
  compass: "Compass",
  unknown: "Unknown",
};

export const SCENARIO_COORDINATE_FRAME_LABELS: Record<
  ConsoleScenarioCoordinateFrame,
  string
> = {
  local: "Local",
  world: "World",
  geo: "Geo",
  unknown: "Unknown",
};
