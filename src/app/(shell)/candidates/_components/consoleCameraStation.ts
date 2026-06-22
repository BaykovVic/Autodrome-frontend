/**
 * Console-shaped camera-station + capture-window snapshot.
 *
 * Backend has no canonical camera-station read model yet; this
 * surface stays on mock/data-adapter layer per spec. No real
 * `getUserMedia()`, no MediaStream / WebRTC, no image upload, no
 * biometry inference, no live polling.
 *
 * Important separation: this is the **face-enrollment** capture
 * surface — the one-time biometric template capture flow at the
 * operator PC. Per-exam face verification / passive liveness lives
 * elsewhere and is NOT mixed into this UI.
 */

export type CameraStationScenario =
  | "ready"
  | "capturing"
  | "done"
  | "cancelled"
  | "permission-denied";

export type CameraPermissionState =
  | "granted"
  | "denied"
  | "prompt";

export type CameraStatusKind =
  | "selected"
  | "no-camera"
  | "permission-denied";

export type CameraDevice = {
  id: string;
  name: string;
  meta: string;
  status: CameraStatusKind;
  permission: CameraPermissionState;
};

export type CaptureWindowKind =
  | "closed"
  | "open"
  | "done"
  | "cancelled";

export type CaptureWindowState = {
  kind: CaptureWindowKind;
  /** Free-form short status, e.g. "Capture window open on the second monitor". */
  label: string;
};

export type QualityProgressItem = {
  id: string;
  label: string;
  /** 0..100 integer for display + a11y. */
  percent: number;
  tone: "online" | "degraded" | "offline";
};

export type CaptureFrameSummary = {
  framesCaptured: number;
  /** Percentage 0..100 for the overall capture progress bar. */
  progressPercent: number;
  /** Best-frame summary copy. */
  bestFrameLabel: string;
};

export type CaptureCheck = {
  id: string;
  label: string;
  /** Icon glyph; the surface picks an SVG by id. */
  iconKind: "ok" | "warn" | "wait";
  tone: "online" | "degraded" | "offline" | "standby";
};

export type CameraStationSnapshot = {
  scenario: CameraStationScenario;
  sessionId: string;
  candidate: string;
  candidateId: string;
  maskedDob: string;
  device: CameraDevice;
  captureWindow: CaptureWindowState;
  quality: QualityProgressItem[];
  capture: CaptureFrameSummary;
  captureChecks: CaptureCheck[];
};

/**
 * Camera-station scenarios where the operator can still act on the
 * session (open capture window / retry / cancel). Terminal scenarios
 * (`done` / `cancelled`) block primary actions per Codex baseline
 * rule for deterministic mock actions.
 */
export const STATION_ACTIVE: ReadonlySet<CameraStationScenario> = new Set([
  "ready",
  "capturing",
]);

export const STATION_TERMINAL: ReadonlySet<CameraStationScenario> = new Set([
  "done",
  "cancelled",
]);
