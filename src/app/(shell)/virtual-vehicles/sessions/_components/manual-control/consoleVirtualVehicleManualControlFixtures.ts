import {
  SENSOR_LABELS,
  disabledReasonFor,
  type ConsoleManualControlPanel,
  type ConsoleManualControlSensorState,
} from "./consoleVirtualVehicleManualControlSnapshot";

function defaultSensors(
  overrides: Partial<
    Record<keyof typeof SENSOR_LABELS, boolean>
  > = {},
): ConsoleManualControlSensorState[] {
  return (
    Object.keys(SENSOR_LABELS) as Array<keyof typeof SENSOR_LABELS>
  ).map((s) => ({
    sensor: s,
    label: SENSOR_LABELS[s],
    enabled: overrides[s] ?? true,
  }));
}

const PANELS: Record<string, ConsoleManualControlPanel> = {
  "VV-SIM-001": {
    sessionId: "VV-SIM-001",
    vehicleLabel: "Sim agent #1",
    sessionState: "running",
    sessionStateLabel: "running",
    speedKmh: 47,
    steering: 0.04,
    sensors: defaultSensors(),
    lastCommandAt: "2026-06-26T09:33:51Z",
  },
  "VV-REPLAY-014": {
    sessionId: "VV-REPLAY-014",
    vehicleLabel: "Replay session #14",
    sessionState: "paused",
    sessionStateLabel: "paused",
    speedKmh: 0,
    steering: 0,
    sensors: defaultSensors({ lanePerception: false }),
    lastCommandAt: "2026-06-26T07:50:01Z",
    disabledReason: disabledReasonFor("paused"),
  },
  "VV-SIM-DEGRADED": {
    sessionId: "VV-SIM-DEGRADED",
    vehicleLabel: "Sim agent · slow",
    sessionState: "degraded",
    sessionStateLabel: "degraded",
    speedKmh: 12,
    steering: -0.12,
    sensors: defaultSensors({ lidar: false, gnss: false }),
    lastCommandAt: "2026-06-26T09:01:00Z",
    disabledReason: disabledReasonFor("degraded"),
  },
  "VV-REPLAY-OLD": {
    sessionId: "VV-REPLAY-OLD",
    vehicleLabel: "Replay session · archived",
    sessionState: "stopped",
    sessionStateLabel: "stopped",
    speedKmh: 0,
    steering: 0,
    sensors: defaultSensors({
      cameraFront: false,
      cameraRear: false,
      lidar: false,
      gnss: false,
      lanePerception: false,
    }),
    lastCommandAt: "2026-06-20T13:41:00Z",
    disabledReason: disabledReasonFor("stopped"),
  },
};

const NOT_FOUND: ConsoleManualControlPanel = {
  sessionId: "—",
  vehicleLabel: "—",
  sessionState: "unknown",
  sessionStateLabel: "unknown",
  speedKmh: 0,
  steering: 0,
  sensors: defaultSensors({
    cameraFront: false,
    cameraRear: false,
    lidar: false,
    imu: false,
    gnss: false,
    wheelOdometry: false,
    lanePerception: false,
  }),
  lastCommandAt: "—",
  disabledReason: disabledReasonFor("unknown"),
};

export function consoleVirtualVehicleManualControlFor(
  sessionId: string,
): ConsoleManualControlPanel {
  const fixture = PANELS[sessionId];
  if (fixture) return { ...fixture };
  return { ...NOT_FOUND, sessionId };
}

export const __MANUAL_CONTROL_FIXTURE_KEYS__ = Object.keys(PANELS);
