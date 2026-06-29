/**
 * Live RPi hardware emulator loader + DTO→view-model mappers +
 * thin-client playback commands.
 *
 * Wires `/rpi-emulator` workspace to the typed
 * `vehicle-simulator-rpi` v1 client. Reads runtime + bridge state
 * via two GETs done in parallel; each call has its own degraded
 * fallback so a single endpoint outage does not break the screen.
 *
 * Per spec rule "RPi runtime backend отдельно" — frontend doesn't
 * speak to raw hardware, only to the canonical control surface
 * via the registered adapter.
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/vehicle-simulator-rpi";

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

type SimulatorRuntimeStatusDto =
  components["schemas"]["SimulatorRuntimeStatus"];
type SimulatorBridgeStatusDto =
  components["schemas"]["SimulatorBridgeStatus"];
type SimulatorScenarioLoadDto =
  components["schemas"]["SimulatorScenarioLoad"];

function isKnownPhase(p: string): p is ConsoleSimulatorPhase {
  return (
    p === "idle" ||
    p === "loaded" ||
    p === "playing" ||
    p === "paused" ||
    p === "stopped" ||
    p === "failed"
  );
}

function isKnownConnection(
  c: string,
): c is ConsoleSimulatorBridgeConnection {
  return (
    c === "disconnected" ||
    c === "connecting" ||
    c === "connected" ||
    c === "degraded"
  );
}

function isKnownScenarioFormat(
  f: string,
): f is ConsoleSimulatorScenarioFormat {
  return f === "legacyLiteReplay" || f === "legacyFullTrajectory";
}

export function mapSimulatorRuntimeDto(
  dto: SimulatorRuntimeStatusDto,
): ConsoleRpiEmulatorRuntime {
  const phase: ConsoleSimulatorPhase = isKnownPhase(dto.phase)
    ? dto.phase
    : "failed";
  const fmt =
    dto.loadedScenarioFormat &&
    isKnownScenarioFormat(dto.loadedScenarioFormat)
      ? dto.loadedScenarioFormat
      : undefined;
  return {
    emulatorId: dto.emulatorId,
    phase,
    phaseLabel: SIMULATOR_PHASE_LABELS[phase],
    loadedScenarioId: dto.loadedScenarioId,
    loadedScenarioFormat: fmt,
    loadedScenarioFormatLabel: fmt
      ? SIMULATOR_SCENARIO_FORMAT_LABELS[fmt]
      : undefined,
    playbackSessionId: dto.playbackSessionId,
    observedAt: dto.observedAt,
  };
}

export function mapSimulatorBridgeDto(
  dto: SimulatorBridgeStatusDto,
): ConsoleRpiEmulatorBridge {
  const connection: ConsoleSimulatorBridgeConnection = isKnownConnection(
    dto.connection,
  )
    ? dto.connection
    : "disconnected";
  return {
    emulatorId: dto.emulatorId,
    connection,
    connectionLabel: SIMULATOR_BRIDGE_LABELS[connection],
    boundTabletDeviceId: dto.boundTabletDeviceId,
    activePlaybackSessionId: dto.activePlaybackSessionId,
    observedAt: dto.observedAt,
    reason: dto.reason,
  };
}

function explain(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Backend fetch failed.";
}

const FALLBACK_RUNTIME: ConsoleRpiEmulatorRuntime = {
  emulatorId: "—",
  phase: "failed",
  phaseLabel: SIMULATOR_PHASE_LABELS.failed,
  observedAt: "—",
};

const FALLBACK_BRIDGE: ConsoleRpiEmulatorBridge = {
  emulatorId: "—",
  connection: "disconnected",
  connectionLabel: SIMULATOR_BRIDGE_LABELS.disconnected,
  observedAt: "—",
};

export async function liveRpiEmulatorLoader(
  adapter: AutodromeApi,
): Promise<ConsoleRpiEmulatorSnapshot> {
  const [runtimeOutcome, bridgeOutcome] = await Promise.allSettled([
    adapter.vehicleSimulatorRpi.GET("/simulator/status", {}),
    adapter.vehicleSimulatorRpi.GET("/simulator/bridge/status", {}),
  ]);

  let runtime = FALLBACK_RUNTIME;
  let runtimeError: string | undefined;
  if (runtimeOutcome.status === "fulfilled") {
    const dto = runtimeOutcome.value.data as
      | SimulatorRuntimeStatusDto
      | undefined;
    if (dto) {
      runtime = mapSimulatorRuntimeDto(dto);
    } else {
      runtimeError = "Runtime status endpoint returned no body.";
    }
  } else {
    runtimeError = explain(runtimeOutcome.reason);
  }

  let bridge = FALLBACK_BRIDGE;
  let bridgeError: string | undefined;
  if (bridgeOutcome.status === "fulfilled") {
    const dto = bridgeOutcome.value.data as
      | SimulatorBridgeStatusDto
      | undefined;
    if (dto) {
      bridge = mapSimulatorBridgeDto(dto);
    } else {
      bridgeError = "Bridge status endpoint returned no body.";
    }
  } else {
    bridgeError = explain(bridgeOutcome.reason);
  }

  return { runtime, bridge, runtimeError, bridgeError };
}

export async function liveRpiScenarioLoad(
  adapter: AutodromeApi,
  request: SimulatorScenarioLoadDto,
): Promise<void> {
  await adapter.vehicleSimulatorRpi.POST("/simulator/scenarios/load", {
    params: { header: { "Idempotency-Key": newCorrelationId() } },
    body: request,
  });
}

export async function liveRpiPlaybackStart(
  adapter: AutodromeApi,
): Promise<void> {
  await adapter.vehicleSimulatorRpi.POST("/simulator/playback/start", {
    params: { header: { "Idempotency-Key": newCorrelationId() } },
  });
}

export async function liveRpiPlaybackPause(
  adapter: AutodromeApi,
): Promise<void> {
  await adapter.vehicleSimulatorRpi.POST("/simulator/playback/pause", {
    params: { header: { "Idempotency-Key": newCorrelationId() } },
  });
}

export async function liveRpiPlaybackResume(
  adapter: AutodromeApi,
): Promise<void> {
  await adapter.vehicleSimulatorRpi.POST("/simulator/playback/resume", {
    params: { header: { "Idempotency-Key": newCorrelationId() } },
  });
}

export async function liveRpiPlaybackStop(
  adapter: AutodromeApi,
): Promise<void> {
  await adapter.vehicleSimulatorRpi.POST("/simulator/playback/stop", {
    params: { header: { "Idempotency-Key": newCorrelationId() } },
  });
}
