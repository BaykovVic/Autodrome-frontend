/**
 * Console-shaped runtime preview snapshot for a virtual
 * vehicle session.
 *
 * Read-only preview surfaces pose / yaw / speed / gear /
 * sensor health alongside scenario compatibility + source
 * badges. No live transport required — view-model has explicit
 * "no-runtime" / "degraded" terminal states so the screen
 * renders honestly without inventing telemetry.
 *
 * Canonical token shape mirrors planned
 * `virtual-vehicle-service-runtime-preview-baseline` so Track 3
 * live wiring drops in без restructuring.
 */

export type ConsoleRuntimePreviewState =
  | "running"
  | "paused"
  | "degraded"
  | "noRuntime"
  | "unknown";

export type ConsoleRuntimeGear =
  | "park"
  | "reverse"
  | "neutral"
  | "drive"
  | "low"
  | "unknown";

export type ConsoleRuntimeSensor =
  | "cameraFront"
  | "cameraRear"
  | "lidar"
  | "imu"
  | "gnss"
  | "wheelOdometry"
  | "lanePerception";

export type ConsoleRuntimeSensorHealth = "ok" | "degraded" | "offline";

export type ConsoleRuntimeSensorReading = {
  sensor: ConsoleRuntimeSensor;
  label: string;
  health: ConsoleRuntimeSensorHealth;
  healthLabel: string;
  /** Optional canonical detail (e.g. "12 Hz" / "no signal"). */
  detail?: string;
};

export type ConsoleRuntimePose = {
  /** Local-frame metres, east. */
  x: number;
  /** Local-frame metres, north. */
  y: number;
  /** Yaw radians; 0 = forward, positive = left turn. */
  yaw: number;
};

export type ConsoleRuntimeScenarioCompatibility = {
  scenarioId: string;
  scenarioLabel: string;
  /** Canonical source token (mirrors scenario catalog). */
  source: "simulator" | "liteReplay" | "fullReplay";
  sourceLabel: string;
  /** Canonical yaw frame token (mirrors scenario catalog). */
  yawFrame: "relative" | "absolute" | "compass" | "unknown";
  yawFrameLabel: string;
  coordinateFrame: "local" | "world" | "geo" | "unknown";
  coordinateFrameLabel: string;
};

export type ConsoleRuntimePreview = {
  sessionId: string;
  vehicleLabel: string;
  state: ConsoleRuntimePreviewState;
  stateLabel: string;
  /** ISO timestamp of the snapshot; "—" when noRuntime. */
  capturedAt: string;
  pose: ConsoleRuntimePose;
  speedKmh: number;
  gear: ConsoleRuntimeGear;
  gearLabel: string;
  sensors: ConsoleRuntimeSensorReading[];
  compatibility: ConsoleRuntimeScenarioCompatibility;
  /** Operator-visible reason when the state is non-running. */
  reason?: string;
};

export const RUNTIME_STATE_LABELS: Record<
  ConsoleRuntimePreviewState,
  string
> = {
  running: "Running",
  paused: "Paused",
  degraded: "Degraded",
  noRuntime: "No runtime",
  unknown: "Unknown",
};

export const RUNTIME_GEAR_LABELS: Record<ConsoleRuntimeGear, string> = {
  park: "Park",
  reverse: "Reverse",
  neutral: "Neutral",
  drive: "Drive",
  low: "Low",
  unknown: "Unknown",
};

export const RUNTIME_SENSOR_LABELS: Record<ConsoleRuntimeSensor, string> = {
  cameraFront: "Front camera",
  cameraRear: "Rear camera",
  lidar: "Lidar",
  imu: "IMU",
  gnss: "GNSS",
  wheelOdometry: "Wheel odometry",
  lanePerception: "Lane perception",
};

export const RUNTIME_SENSOR_HEALTH_LABELS: Record<
  ConsoleRuntimeSensorHealth,
  string
> = {
  ok: "OK",
  degraded: "Degraded",
  offline: "Offline",
};

export function runtimePreviewReasonFor(
  state: ConsoleRuntimePreviewState,
): string {
  switch (state) {
    case "running":
      return "";
    case "paused":
      return "Session is paused — the preview shows the last captured pose and sensor health.";
    case "degraded":
      return "Runtime is degraded; pose and sensor telemetry may be stale.";
    case "noRuntime":
      return "No runtime snapshot is available for this session. Start a session in the monitor to begin capturing pose and sensor telemetry.";
    case "unknown":
    default:
      return "Session state unknown — no runtime preview available.";
  }
}

/** Yaw radians → human-readable degrees with sign. */
export function formatYawDegrees(yawRad: number): string {
  const deg = (yawRad * 180) / Math.PI;
  const rounded = Math.round(deg * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)}°`;
}

/** Pose → human-readable "x m E, y m N" with mono-friendly format. */
export function formatPose(pose: ConsoleRuntimePose): string {
  return `${pose.x.toFixed(2)} m E, ${pose.y.toFixed(2)} m N`;
}
