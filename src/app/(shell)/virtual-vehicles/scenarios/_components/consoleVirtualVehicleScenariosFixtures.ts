import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleVirtualVehicleScenario,
  ConsoleVirtualVehicleScenariosSnapshot,
} from "./consoleVirtualVehicleScenariosSnapshot";

const SCENARIOS: ConsoleVirtualVehicleScenario[] = [
  {
    id: "SC-CITY-A",
    code: "SC-CITY-A",
    name: "City A · daylight",
    description:
      "Urban grid, daylight conditions, scripted pedestrian crossings.",
    source: "simulator",
    sourceLabel: "Simulator",
    yawFrame: "absolute",
    yawFrameLabel: "Absolute",
    coordinateFrame: "world",
    coordinateFrameLabel: "World",
    status: "published",
    statusLabel: "published",
    updatedAt: "2026-06-22T10:00:00Z",
    version: "v4",
  },
  {
    id: "SC-RAMP-B",
    code: "SC-RAMP-B",
    name: "Ramp B · merging",
    description:
      "On-ramp merge scenario with three lead vehicles, dynamic speed.",
    source: "simulator",
    sourceLabel: "Simulator",
    yawFrame: "absolute",
    yawFrameLabel: "Absolute",
    coordinateFrame: "world",
    coordinateFrameLabel: "World",
    status: "published",
    statusLabel: "published",
    updatedAt: "2026-06-21T15:00:00Z",
    version: "v2",
  },
  {
    id: "SC-FREE-DRIVE",
    code: "SC-FREE-DRIVE",
    name: "Free drive · open road",
    description:
      "Operator manual control sandbox; no scripted events.",
    source: "simulator",
    sourceLabel: "Simulator",
    yawFrame: "relative",
    yawFrameLabel: "Relative",
    coordinateFrame: "local",
    coordinateFrameLabel: "Local",
    status: "published",
    statusLabel: "published",
    updatedAt: "2026-06-20T08:30:00Z",
    version: "v1",
  },
  {
    id: "SC-LITE-014",
    code: "SC-LITE-014",
    name: "Legacy Lite · city loop",
    description:
      "Lite replay sourced from pre-canonical trajectory dump #014.",
    source: "liteReplay",
    sourceLabel: "Legacy Lite replay",
    yawFrame: "relative",
    yawFrameLabel: "Relative",
    coordinateFrame: "local",
    coordinateFrameLabel: "Local",
    status: "published",
    statusLabel: "published",
    updatedAt: "2026-06-10T12:00:00Z",
    version: "v3",
  },
  {
    id: "SC-FULL-042",
    code: "SC-FULL-042",
    name: "Legacy Full · highway",
    description:
      "Full-fidelity trajectory import (#042) with absolute yaw.",
    source: "fullReplay",
    sourceLabel: "Legacy Full replay",
    yawFrame: "absolute",
    yawFrameLabel: "Absolute",
    coordinateFrame: "geo",
    coordinateFrameLabel: "Geo",
    status: "published",
    statusLabel: "published",
    updatedAt: "2026-06-15T17:00:00Z",
    version: "v2",
  },
  {
    id: "SC-DRAFT-NEW",
    code: "SC-DRAFT-NEW",
    name: "Draft · stress harness",
    description:
      "Work-in-progress high-load harness; not yet released to operators.",
    source: "simulator",
    sourceLabel: "Simulator",
    yawFrame: "unknown",
    yawFrameLabel: "Unknown",
    coordinateFrame: "unknown",
    coordinateFrameLabel: "Unknown",
    status: "draft",
    statusLabel: "draft",
    updatedAt: "2026-06-25T19:00:00Z",
    version: "—",
  },
  {
    id: "SC-LOOP-CITY",
    code: "SC-LOOP-CITY",
    name: "City loop · v0.4",
    description:
      "Archived after v0.5 superseded it; kept for regression replays.",
    source: "liteReplay",
    sourceLabel: "Legacy Lite replay",
    yawFrame: "relative",
    yawFrameLabel: "Relative",
    coordinateFrame: "local",
    coordinateFrameLabel: "Local",
    status: "archived",
    statusLabel: "archived",
    updatedAt: "2026-04-12T09:00:00Z",
    version: "v0.4",
  },
];

function snapshotFor(
  list: ConsoleVirtualVehicleScenario[],
): ConsoleVirtualVehicleScenariosSnapshot {
  return {
    totals: {
      total: list.length,
      published: list.filter((s) => s.status === "published").length,
      drafts: list.filter((s) => s.status === "draft").length,
    },
    scenarios: list,
  };
}

const EMPTY: ConsoleVirtualVehicleScenariosSnapshot = {
  totals: { total: 0, published: 0, drafts: 0 },
  scenarios: [],
};

export function consoleVirtualVehicleScenariosFor(
  scenario: MockScenario,
): ConsoleVirtualVehicleScenariosSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return EMPTY;
    default:
      return snapshotFor(SCENARIOS);
  }
}

export const __VIRTUAL_VEHICLE_SCENARIOS_FIXTURE__ = SCENARIOS;
