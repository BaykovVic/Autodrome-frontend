import {
  SIMULATOR_BRIDGE_LABELS,
  SIMULATOR_PHASE_LABELS,
  SIMULATOR_SCENARIO_FORMAT_LABELS,
  type ConsoleRpiEmulatorBridge,
  type ConsoleRpiEmulatorRuntime,
  type ConsoleRpiEmulatorSnapshot,
  type ConsoleSimulatorBridgeConnection,
  type ConsoleSimulatorPhase,
  type ConsoleSimulatorScenarioFormat,
} from "./consoleRpiEmulator";

export type RpiEmulatorFixtureKind =
  | "idle"
  | "loaded"
  | "playing"
  | "paused"
  | "stopped"
  | "failed"
  | "bridge-degraded";

const EMULATOR_ID = "11111111-1111-4111-8111-111111111111";
const SCENARIO_ID = "22222222-2222-4222-8222-222222222222";
const PLAYBACK_SESSION_ID = "33333333-3333-4333-8333-333333333333";
const TABLET_DEVICE_ID = "44444444-4444-4444-8444-444444444444";

function runtimeFor(
  phase: ConsoleSimulatorPhase,
  scenarioFormat: ConsoleSimulatorScenarioFormat = "legacyLiteReplay",
): ConsoleRpiEmulatorRuntime {
  const isLoaded = phase !== "idle";
  return {
    emulatorId: EMULATOR_ID,
    phase,
    phaseLabel: SIMULATOR_PHASE_LABELS[phase],
    loadedScenarioId: isLoaded ? SCENARIO_ID : undefined,
    loadedScenarioFormat: isLoaded ? scenarioFormat : undefined,
    loadedScenarioFormatLabel: isLoaded
      ? SIMULATOR_SCENARIO_FORMAT_LABELS[scenarioFormat]
      : undefined,
    playbackSessionId:
      phase === "playing" || phase === "paused"
        ? PLAYBACK_SESSION_ID
        : undefined,
    observedAt: "2026-06-29T08:00:00Z",
  };
}

function bridgeFor(
  connection: ConsoleSimulatorBridgeConnection,
  active: boolean,
  reason?: string,
): ConsoleRpiEmulatorBridge {
  return {
    emulatorId: EMULATOR_ID,
    connection,
    connectionLabel: SIMULATOR_BRIDGE_LABELS[connection],
    boundTabletDeviceId:
      connection !== "disconnected" ? TABLET_DEVICE_ID : undefined,
    activePlaybackSessionId: active ? PLAYBACK_SESSION_ID : undefined,
    observedAt: "2026-06-29T08:00:05Z",
    reason,
  };
}

export function consoleRpiEmulatorFor(
  kind: RpiEmulatorFixtureKind,
): ConsoleRpiEmulatorSnapshot {
  switch (kind) {
    case "idle":
      return {
        runtime: runtimeFor("idle"),
        bridge: bridgeFor("connected", false),
      };
    case "loaded":
      return {
        runtime: runtimeFor("loaded"),
        bridge: bridgeFor("connected", false),
      };
    case "playing":
      return {
        runtime: runtimeFor("playing"),
        bridge: bridgeFor("connected", true),
      };
    case "paused":
      return {
        runtime: runtimeFor("paused"),
        bridge: bridgeFor("connected", true),
      };
    case "stopped":
      return {
        runtime: runtimeFor("stopped"),
        bridge: bridgeFor("connected", false),
      };
    case "failed":
      return {
        runtime: runtimeFor("failed"),
        bridge: bridgeFor("degraded", false, "hardware_bus_unreachable"),
        bridgeError: undefined,
      };
    case "bridge-degraded":
      return {
        runtime: runtimeFor("loaded"),
        bridge: bridgeFor(
          "degraded",
          false,
          "tablet_unreachable",
        ),
      };
  }
}
