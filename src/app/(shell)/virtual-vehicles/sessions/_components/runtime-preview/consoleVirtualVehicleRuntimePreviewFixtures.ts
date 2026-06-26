import {
  RUNTIME_GEAR_LABELS,
  RUNTIME_SENSOR_HEALTH_LABELS,
  RUNTIME_SENSOR_LABELS,
  RUNTIME_STATE_LABELS,
  runtimePreviewReasonFor,
  type ConsoleRuntimePreview,
  type ConsoleRuntimeSensor,
  type ConsoleRuntimeSensorHealth,
  type ConsoleRuntimeSensorReading,
} from "./consoleVirtualVehicleRuntimePreviewSnapshot";

function sensor(
  s: ConsoleRuntimeSensor,
  health: ConsoleRuntimeSensorHealth,
  detail?: string,
): ConsoleRuntimeSensorReading {
  return {
    sensor: s,
    label: RUNTIME_SENSOR_LABELS[s],
    health,
    healthLabel: RUNTIME_SENSOR_HEALTH_LABELS[health],
    detail,
  };
}

function defaultSensors(
  overrides: Partial<
    Record<ConsoleRuntimeSensor, ConsoleRuntimeSensorHealth>
  > = {},
): ConsoleRuntimeSensorReading[] {
  return (
    Object.keys(RUNTIME_SENSOR_LABELS) as ConsoleRuntimeSensor[]
  ).map((s) => sensor(s, overrides[s] ?? "ok"));
}

const PREVIEWS: Record<string, ConsoleRuntimePreview> = {
  "VV-SIM-001": {
    sessionId: "VV-SIM-001",
    vehicleLabel: "Sim agent #1",
    state: "running",
    stateLabel: RUNTIME_STATE_LABELS.running,
    capturedAt: "2026-06-26T09:34:12Z",
    pose: { x: 42.18, y: -7.93, yaw: 0.1571 },
    speedKmh: 47,
    gear: "drive",
    gearLabel: RUNTIME_GEAR_LABELS.drive,
    sensors: defaultSensors(),
    compatibility: {
      scenarioId: "SC-CITY-A",
      scenarioLabel: "City circuit · A",
      source: "simulator",
      sourceLabel: "Simulator",
      yawFrame: "relative",
      yawFrameLabel: "Relative",
      coordinateFrame: "local",
      coordinateFrameLabel: "Local",
    },
  },
  "VV-REPLAY-014": {
    sessionId: "VV-REPLAY-014",
    vehicleLabel: "Replay session #14",
    state: "paused",
    stateLabel: RUNTIME_STATE_LABELS.paused,
    capturedAt: "2026-06-26T07:50:01Z",
    pose: { x: -12.4, y: 18.62, yaw: -0.7854 },
    speedKmh: 0,
    gear: "park",
    gearLabel: RUNTIME_GEAR_LABELS.park,
    sensors: defaultSensors({ lanePerception: "offline" }),
    compatibility: {
      scenarioId: "SC-FULL-042",
      scenarioLabel: "Highway merge · full",
      source: "fullReplay",
      sourceLabel: "Legacy Full replay",
      yawFrame: "absolute",
      yawFrameLabel: "Absolute",
      coordinateFrame: "world",
      coordinateFrameLabel: "World",
    },
    reason: runtimePreviewReasonFor("paused"),
  },
  "VV-SIM-DEGRADED": {
    sessionId: "VV-SIM-DEGRADED",
    vehicleLabel: "Sim agent · slow",
    state: "degraded",
    stateLabel: RUNTIME_STATE_LABELS.degraded,
    capturedAt: "2026-06-26T09:00:48Z",
    pose: { x: 5.11, y: 1.07, yaw: -0.21 },
    speedKmh: 12,
    gear: "drive",
    gearLabel: RUNTIME_GEAR_LABELS.drive,
    sensors: defaultSensors({
      lidar: "offline",
      gnss: "degraded",
    }),
    compatibility: {
      scenarioId: "SC-LITE-014",
      scenarioLabel: "Parking yard · lite",
      source: "liteReplay",
      sourceLabel: "Legacy Lite replay",
      yawFrame: "compass",
      yawFrameLabel: "Compass",
      coordinateFrame: "geo",
      coordinateFrameLabel: "Geo",
    },
    reason: runtimePreviewReasonFor("degraded"),
  },
  "VV-REPLAY-OLD": {
    sessionId: "VV-REPLAY-OLD",
    vehicleLabel: "Replay session · archived",
    state: "noRuntime",
    stateLabel: RUNTIME_STATE_LABELS.noRuntime,
    capturedAt: "—",
    pose: { x: 0, y: 0, yaw: 0 },
    speedKmh: 0,
    gear: "unknown",
    gearLabel: RUNTIME_GEAR_LABELS.unknown,
    sensors: defaultSensors({
      cameraFront: "offline",
      cameraRear: "offline",
      lidar: "offline",
      imu: "offline",
      gnss: "offline",
      wheelOdometry: "offline",
      lanePerception: "offline",
    }),
    compatibility: {
      scenarioId: "SC-FULL-021",
      scenarioLabel: "Service yard · full",
      source: "fullReplay",
      sourceLabel: "Legacy Full replay",
      yawFrame: "absolute",
      yawFrameLabel: "Absolute",
      coordinateFrame: "world",
      coordinateFrameLabel: "World",
    },
    reason: runtimePreviewReasonFor("noRuntime"),
  },
};

const NOT_FOUND: ConsoleRuntimePreview = {
  sessionId: "—",
  vehicleLabel: "—",
  state: "unknown",
  stateLabel: RUNTIME_STATE_LABELS.unknown,
  capturedAt: "—",
  pose: { x: 0, y: 0, yaw: 0 },
  speedKmh: 0,
  gear: "unknown",
  gearLabel: RUNTIME_GEAR_LABELS.unknown,
  sensors: defaultSensors({
    cameraFront: "offline",
    cameraRear: "offline",
    lidar: "offline",
    imu: "offline",
    gnss: "offline",
    wheelOdometry: "offline",
    lanePerception: "offline",
  }),
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

export function consoleVirtualVehicleRuntimePreviewFor(
  sessionId: string,
): ConsoleRuntimePreview {
  const fixture = PREVIEWS[sessionId];
  if (fixture) return { ...fixture };
  return { ...NOT_FOUND, sessionId };
}

export const __RUNTIME_PREVIEW_FIXTURE_KEYS__ = Object.keys(PREVIEWS);
