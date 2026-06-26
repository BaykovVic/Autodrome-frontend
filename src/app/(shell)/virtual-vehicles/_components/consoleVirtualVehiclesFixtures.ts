import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleVirtualVehicle,
  ConsoleVirtualVehiclesSnapshot,
} from "./consoleVirtualVehiclesSnapshot";

const VEHICLES: ConsoleVirtualVehicle[] = [
  {
    id: "VV-SIM-001",
    label: "Sim agent #1",
    source: "simulator",
    sourceLabel: "Simulator",
    status: "running",
    statusLabel: "running",
    scenarioId: "SC-CITY-A",
    scenarioLabel: "City A · daylight",
    startedAt: "2026-06-26T08:00:00Z",
    lastTelemetryAt: "2026-06-26T09:34:11Z",
    notes: "Pilot dry run; do not stop without operator note.",
  },
  {
    id: "VV-SIM-002",
    label: "Sim agent #2",
    source: "simulator",
    sourceLabel: "Simulator",
    status: "idle",
    statusLabel: "idle",
    scenarioId: "—",
    scenarioLabel: "—",
    startedAt: "—",
    lastTelemetryAt: "—",
  },
  {
    id: "VV-REPLAY-014",
    label: "Replay session #14",
    source: "legacyReplay",
    sourceLabel: "Legacy replay",
    status: "paused",
    statusLabel: "paused",
    scenarioId: "SC-RAMP-B",
    scenarioLabel: "Ramp B · merging",
    startedAt: "2026-06-26T07:30:00Z",
    lastTelemetryAt: "2026-06-26T07:52:18Z",
  },
  {
    id: "VV-MANUAL-LIVE-3",
    label: "Manual control · op 3",
    source: "operatorManual",
    sourceLabel: "Operator manual",
    status: "running",
    statusLabel: "running",
    scenarioId: "SC-FREE-DRIVE",
    scenarioLabel: "Free drive · open road",
    startedAt: "2026-06-26T09:10:00Z",
    lastTelemetryAt: "2026-06-26T09:34:09Z",
  },
  {
    id: "VV-SIM-DEGRADED",
    label: "Sim agent · slow",
    source: "simulator",
    sourceLabel: "Simulator",
    status: "degraded",
    statusLabel: "degraded",
    scenarioId: "SC-HIGH-LOAD",
    scenarioLabel: "High-load stress",
    startedAt: "2026-06-26T06:00:00Z",
    lastTelemetryAt: "2026-06-26T09:28:12Z",
    notes: "Telemetry stream behind threshold (>20s gap).",
  },
  {
    id: "VV-REPLAY-OLD",
    label: "Replay session · archived",
    source: "legacyReplay",
    sourceLabel: "Legacy replay",
    status: "stopped",
    statusLabel: "stopped",
    scenarioId: "SC-LOOP-CITY",
    scenarioLabel: "City loop · v0.4",
    startedAt: "2026-06-20T13:00:00Z",
    lastTelemetryAt: "2026-06-20T13:42:00Z",
  },
];

function snapshotFor(
  list: ConsoleVirtualVehicle[],
): ConsoleVirtualVehiclesSnapshot {
  return {
    totals: {
      total: list.length,
      running: list.filter((v) => v.status === "running").length,
      idle: list.filter((v) => v.status === "idle").length,
      degraded: list.filter((v) => v.status === "degraded").length,
    },
    vehicles: list,
  };
}

const EMPTY: ConsoleVirtualVehiclesSnapshot = {
  totals: { total: 0, running: 0, idle: 0, degraded: 0 },
  vehicles: [],
};

/**
 * `service-degraded` mock scenario drops the list to model the
 * future `503 SERVICE_DEGRADED` canonical response — UI должно
 * рендерить EmptyState без падений.
 */
const DEGRADED: ConsoleVirtualVehiclesSnapshot = EMPTY;

export function consoleVirtualVehiclesFor(
  scenario: MockScenario,
): ConsoleVirtualVehiclesSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return DEGRADED;
    default:
      return snapshotFor(VEHICLES);
  }
}

/** Exposed for fixture-shape unit tests. */
export const __VIRTUAL_VEHICLES_FIXTURE__ = VEHICLES;
