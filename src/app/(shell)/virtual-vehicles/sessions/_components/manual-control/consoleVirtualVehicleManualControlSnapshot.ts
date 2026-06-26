/**
 * Console-shaped manual control panel state.
 *
 * Operator panel that issues speed / steering / position-reset
 * / sensor-toggle commands к virtual-vehicle session. All
 * canonical token names mirror the planned
 * `virtual-vehicle-service-manual-control-baseline` shape so
 * Track 3 live wiring drops in без restructuring the view-model.
 *
 * Per spec rule "No raw bitmask-only UI": sensor toggles use
 * normalized canonical sensor tokens, not numeric flag bits.
 */

export type ConsoleManualControlSessionState =
  | "running"
  | "paused"
  | "stopped"
  | "starting"
  | "degraded"
  | "unknown";

/**
 * Canonical sensor capability tokens. Operator-friendly labels
 * live в `SENSOR_LABELS` lookup, rendered alongside canonical
 * mono chip.
 */
export type ConsoleManualControlSensor =
  | "cameraFront"
  | "cameraRear"
  | "lidar"
  | "imu"
  | "gnss"
  | "wheelOdometry"
  | "lanePerception";

export type ConsoleManualControlSensorState = {
  sensor: ConsoleManualControlSensor;
  label: string;
  enabled: boolean;
};

export type ConsoleManualControlPanel = {
  sessionId: string;
  vehicleLabel: string;
  sessionState: ConsoleManualControlSessionState;
  sessionStateLabel: string;
  /** km/h, range 0..200; rendered as slider. */
  speedKmh: number;
  /** steering -1..1 (left negative, right positive). */
  steering: number;
  sensors: ConsoleManualControlSensorState[];
  /** Last operator command timestamp, ISO; `"—"` when never. */
  lastCommandAt: string;
  /** Hint surfaced when controls disabled because session state. */
  disabledReason?: string;
};

export const SENSOR_LABELS: Record<ConsoleManualControlSensor, string> = {
  cameraFront: "Front camera",
  cameraRear: "Rear camera",
  lidar: "Lidar",
  imu: "IMU",
  gnss: "GNSS",
  wheelOdometry: "Wheel odometry",
  lanePerception: "Lane perception",
};

/**
 * Returns whether the manual control panel should accept
 * operator input. Only `running` allows live edits; everything
 * else (paused / stopped / starting / degraded / unknown)
 * leaves controls disabled with an operator-visible reason.
 */
export function manualControlsAllowed(
  state: ConsoleManualControlSessionState,
): boolean {
  return state === "running";
}

export function disabledReasonFor(
  state: ConsoleManualControlSessionState,
): string {
  switch (state) {
    case "running":
      return "";
    case "paused":
      return "Session is paused — resume it from the session monitor before issuing manual control.";
    case "stopped":
      return "Session is stopped — spawn a fresh session before issuing manual control.";
    case "starting":
      return "Session is starting up — controls open once it transitions to running.";
    case "degraded":
      return "Session is in degraded state; manual control is read-only until the runtime recovers.";
    case "unknown":
    default:
      return "Session state unknown — no manual control available.";
  }
}
