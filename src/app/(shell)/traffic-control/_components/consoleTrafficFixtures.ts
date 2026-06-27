import type { MockScenario } from "@/api/mock/scenarios";

import {
  CONTROLLER_STATUS_LABELS,
  type ConsoleTrafficController,
  type ConsoleTrafficLight,
  type ConsoleTrafficSnapshot,
} from "./consoleTrafficSnapshot";

const CONTROLLERS: ConsoleTrafficController[] = [
  {
    controllerId: "c0000000-0000-4000-8000-000000000001",
    status: "healthy",
    statusLabel: CONTROLLER_STATUS_LABELS.healthy,
    address: "192.168.10.21",
    capabilities: ["setProgram", "setState", "reset"],
  },
  {
    controllerId: "c0000000-0000-4000-8000-000000000002",
    status: "degraded",
    statusLabel: CONTROLLER_STATUS_LABELS.degraded,
    address: "192.168.10.22",
    capabilities: ["setProgram", "setState", "reset", "blink"],
  },
  {
    controllerId: "c0000000-0000-4000-8000-000000000003",
    status: "offline",
    statusLabel: CONTROLLER_STATUS_LABELS.offline,
    address: "192.168.10.23",
    capabilities: ["setProgram"],
  },
];

const LIGHTS: ConsoleTrafficLight[] = [
  {
    lightId: "d0000000-0000-4000-8000-000000000001",
    controllerId: "c0000000-0000-4000-8000-000000000001",
    positionRef: "main-gate/north",
    state: "green",
  },
  {
    lightId: "d0000000-0000-4000-8000-000000000002",
    controllerId: "c0000000-0000-4000-8000-000000000001",
    positionRef: "main-gate/south",
    state: "red",
  },
  {
    lightId: "d0000000-0000-4000-8000-000000000003",
    controllerId: "c0000000-0000-4000-8000-000000000002",
    positionRef: "exam-zone/crosswalk",
    state: "blinkingAmber",
  },
];

const NORMAL: ConsoleTrafficSnapshot = {
  controllers: CONTROLLERS,
  lights: LIGHTS,
  recentCommands: [],
};

const SERVICE_DEGRADED: ConsoleTrafficSnapshot = {
  controllers: CONTROLLERS.filter((c) => c.status !== "offline"),
  lights: LIGHTS,
  recentCommands: [],
  degradedNote:
    "Traffic control service is degraded — offline controllers are not reachable for commands.",
};

const EMPTY: ConsoleTrafficSnapshot = {
  controllers: [],
  lights: [],
  recentCommands: [],
};

export function consoleTrafficFor(
  scenario: MockScenario,
): ConsoleTrafficSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    case "violations-detected":
    case "exam-in-progress":
    default:
      return NORMAL;
  }
}
