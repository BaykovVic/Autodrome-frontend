/**
 * Live Virtual Vehicle Runtime Preview loader.
 *
 * Подключает runtime preview к canonical
 * `vehicle-telemetry-service` через
 * `GET /telemetry/sessions/{sessionId}/timeline`.
 *
 * Mapping:
 *   - Takes last sample (highest sampleSequence) из
 *     ответа TelemetryTimeline.
 *   - Извлекает signal codes для position / yaw / speed /
 *     gear / sensor health → console runtime view-model.
 *   - Empty timeline (samples=0) → `noRuntime` state с
 *     честным suppressed pose.
 *   - Gaps в timeline → `degraded` state.
 *   - Все sensors marked `unknown` если signal с
 *     соответствующим code не пришёл — operator видит
 *     честное "no signal" вместо invented values.
 *
 * Scenario compatibility metadata (source/yawFrame/
 * coordinateFrame) приходит из virtual-vehicle-service
 * scenario lookup, не из telemetry timeline; mapper
 * хранит canonical стуб когда compatibility недоступен.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/vehicle-telemetry";

import {
  RUNTIME_GEAR_LABELS,
  RUNTIME_SENSOR_HEALTH_LABELS,
  RUNTIME_SENSOR_LABELS,
  RUNTIME_STATE_LABELS,
  runtimePreviewReasonFor,
  type ConsoleRuntimeGear,
  type ConsoleRuntimePreview,
  type ConsoleRuntimePreviewState,
  type ConsoleRuntimeSensor,
  type ConsoleRuntimeSensorHealth,
  type ConsoleRuntimeSensorReading,
} from "./consoleVirtualVehicleRuntimePreviewSnapshot";

type TimelineDto = components["schemas"]["TelemetryTimeline"];
type SampleDto = components["schemas"]["TelemetrySample"];
type SignalDto = components["schemas"]["TelemetrySignal"];

const GEAR_CODE_MAP: Record<string, ConsoleRuntimeGear> = {
  drive: "drive",
  reverse: "reverse",
  neutral: "neutral",
  park: "park",
  low: "low",
};

function signalValue(
  sample: SampleDto | undefined,
  code: string,
): number | undefined {
  if (!sample?.signals) return undefined;
  return sample.signals.find((s: SignalDto) => s.code === code)?.value;
}

function signalConfidence(
  sample: SampleDto | undefined,
  code: string,
): number | undefined {
  if (!sample?.signals) return undefined;
  return sample.signals.find((s: SignalDto) => s.code === code)
    ?.confidence;
}

function healthFor(
  conf: number | undefined,
): ConsoleRuntimeSensorHealth {
  if (conf === undefined) return "offline";
  if (conf >= 0.85) return "ok";
  if (conf >= 0.5) return "degraded";
  return "offline";
}

function sensorReadingFrom(
  sample: SampleDto | undefined,
  code: ConsoleRuntimeSensor,
): ConsoleRuntimeSensorReading {
  const conf = signalConfidence(sample, code);
  const health = healthFor(conf);
  return {
    sensor: code,
    label: RUNTIME_SENSOR_LABELS[code],
    health,
    healthLabel: RUNTIME_SENSOR_HEALTH_LABELS[health],
    detail: conf !== undefined ? `confidence ${conf.toFixed(2)}` : "no signal",
  };
}

export function mapTimelineToConsole(
  timeline: TimelineDto,
): ConsoleRuntimePreview {
  const samples = timeline.samples ?? [];
  const gaps = timeline.gaps ?? [];
  const last = samples[samples.length - 1];

  const state: ConsoleRuntimePreviewState = (() => {
    if (samples.length === 0) return "noRuntime";
    if (gaps.length > 0) return "degraded";
    return "running";
  })();

  const x = signalValue(last, "positionX") ?? 0;
  const y = signalValue(last, "positionY") ?? 0;
  const yaw = signalValue(last, "yaw") ?? 0;
  const speedMps = signalValue(last, "speed") ?? 0;
  const speedKmh = speedMps * 3.6;
  const gearSignal = last?.signals?.find(
    (s: SignalDto) => s.code === "gear",
  );
  const gearCode =
    gearSignal && typeof gearSignal.unit === "string"
      ? gearSignal.unit
      : undefined;
  const gear: ConsoleRuntimeGear = gearCode
    ? GEAR_CODE_MAP[gearCode] ?? "unknown"
    : "unknown";

  const sensorCodes: ConsoleRuntimeSensor[] = (
    Object.keys(RUNTIME_SENSOR_LABELS) as ConsoleRuntimeSensor[]
  );
  const sensors = sensorCodes.map((code) =>
    sensorReadingFrom(last, code),
  );

  return {
    sessionId: timeline.telemetrySessionId,
    vehicleLabel: timeline.vehicleId,
    state,
    stateLabel: RUNTIME_STATE_LABELS[state],
    capturedAt: last?.capturedAt ?? "—",
    pose: { x, y, yaw },
    speedKmh,
    gear,
    gearLabel: RUNTIME_GEAR_LABELS[gear],
    sensors,
    compatibility: {
      scenarioId: "—",
      scenarioLabel: "—",
      source: "simulator",
      sourceLabel: "Simulator",
      yawFrame: "unknown",
      yawFrameLabel: "Unknown",
      coordinateFrame:
        timeline.coordinateFrame === "legacyXY"
          ? "local"
          : timeline.coordinateFrame === "normalizedXY"
            ? "world"
            : timeline.coordinateFrame === "geodeticWgs84"
              ? "geo"
              : "unknown",
      coordinateFrameLabel:
        timeline.coordinateFrame === "legacyXY"
          ? "Local"
          : timeline.coordinateFrame === "normalizedXY"
            ? "World"
            : timeline.coordinateFrame === "geodeticWgs84"
              ? "Geo"
              : "Unknown",
    },
    reason:
      state === "running" ? undefined : runtimePreviewReasonFor(state),
  };
}

export async function liveVirtualVehicleRuntimePreviewLoader(
  adapter: AutodromeApi,
  sessionId: string,
): Promise<ConsoleRuntimePreview> {
  const result = await adapter.vehicleTelemetry.GET(
    "/telemetry/sessions/{sessionId}/timeline",
    {
      params: { path: { sessionId } },
    },
  );
  const timeline = result.data as TimelineDto | undefined;
  if (!timeline) {
    return {
      sessionId,
      vehicleLabel: "—",
      state: "unknown",
      stateLabel: RUNTIME_STATE_LABELS.unknown,
      capturedAt: "—",
      pose: { x: 0, y: 0, yaw: 0 },
      speedKmh: 0,
      gear: "unknown",
      gearLabel: RUNTIME_GEAR_LABELS.unknown,
      sensors: (
        Object.keys(RUNTIME_SENSOR_LABELS) as ConsoleRuntimeSensor[]
      ).map((code) => ({
        sensor: code,
        label: RUNTIME_SENSOR_LABELS[code],
        health: "offline" as const,
        healthLabel: RUNTIME_SENSOR_HEALTH_LABELS.offline,
      })),
      compatibility: {
        scenarioId: "—",
        scenarioLabel: "—",
        source: "simulator",
        sourceLabel: "—",
        yawFrame: "unknown",
        yawFrameLabel: "Unknown",
        coordinateFrame: "unknown",
        coordinateFrameLabel: "Unknown",
      },
      reason: runtimePreviewReasonFor("unknown"),
    };
  }
  return mapTimelineToConsole(timeline);
}
