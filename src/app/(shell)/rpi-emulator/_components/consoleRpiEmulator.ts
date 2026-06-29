/**
 * Console-shaped RPi hardware emulator snapshot.
 *
 * Per spec rule "не смешиваем Web VirtualVehicle и RPi emulator
 * views", this surface keeps its own view-model + ids and does
 * NOT reuse `virtual-vehicle-service` session ids. Canonical
 * scenario format tokens are preserved verbatim alongside
 * operator-friendly labels so the operator physically cannot
 * confuse a Web VirtualVehicle session with an RPi emulator
 * scenario.
 *
 * Canonical contract: `vehicle-simulator-rpi` v1
 * (`/simulator/status`, `/simulator/bridge/status`,
 * `/simulator/scenarios/load`,
 * `/simulator/playback/{start|pause|resume|stop}`).
 */

export type ConsoleSimulatorPhase =
  | "idle"
  | "loaded"
  | "playing"
  | "paused"
  | "stopped"
  | "failed";

export type ConsoleSimulatorScenarioFormat =
  | "legacyLiteReplay"
  | "legacyFullTrajectory";

export type ConsoleSimulatorBridgeConnection =
  | "disconnected"
  | "connecting"
  | "connected"
  | "degraded";

export const SIMULATOR_PHASE_LABELS: Record<
  ConsoleSimulatorPhase,
  string
> = {
  idle: "Idle",
  loaded: "Scenario loaded",
  playing: "Playing",
  paused: "Paused",
  stopped: "Stopped",
  failed: "Failed",
};

export const SIMULATOR_SCENARIO_FORMAT_LABELS: Record<
  ConsoleSimulatorScenarioFormat,
  string
> = {
  legacyLiteReplay: "Legacy Lite replay",
  legacyFullTrajectory: "Legacy Full trajectory",
};

export const SIMULATOR_BRIDGE_LABELS: Record<
  ConsoleSimulatorBridgeConnection,
  string
> = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
  degraded: "Degraded",
};

export type ConsoleRpiEmulatorRuntime = {
  emulatorId: string;
  phase: ConsoleSimulatorPhase;
  phaseLabel: string;
  loadedScenarioId?: string;
  loadedScenarioFormat?: ConsoleSimulatorScenarioFormat;
  loadedScenarioFormatLabel?: string;
  playbackSessionId?: string;
  observedAt: string;
};

export type ConsoleRpiEmulatorBridge = {
  emulatorId: string;
  connection: ConsoleSimulatorBridgeConnection;
  connectionLabel: string;
  boundTabletDeviceId?: string;
  activePlaybackSessionId?: string;
  observedAt: string;
  reason?: string;
};

export type ConsoleRpiEmulatorSnapshot = {
  runtime: ConsoleRpiEmulatorRuntime;
  bridge: ConsoleRpiEmulatorBridge;
  /** Optional captured fetch error for `runtime` (degraded panel). */
  runtimeError?: string;
  /** Optional captured fetch error for `bridge` (degraded panel). */
  bridgeError?: string;
};

export function isPlaybackActionAllowed(
  phase: ConsoleSimulatorPhase,
  action: "start" | "pause" | "resume" | "stop",
): boolean {
  switch (action) {
    case "start":
      return phase === "loaded" || phase === "stopped";
    case "pause":
      return phase === "playing";
    case "resume":
      return phase === "paused";
    case "stop":
      return (
        phase === "playing" ||
        phase === "paused" ||
        phase === "loaded"
      );
    default:
      return false;
  }
}

export function isScenarioLoadAllowed(
  phase: ConsoleSimulatorPhase,
): boolean {
  // Load requires the playback to be idle/stopped/failed so the
  // emulator does not silently swap a running scenario.
  return phase === "idle" || phase === "stopped" || phase === "failed";
}
