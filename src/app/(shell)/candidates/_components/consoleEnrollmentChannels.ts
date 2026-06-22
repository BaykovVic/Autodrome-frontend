/**
 * Enrollment-channel snapshot for the candidate "Start enrollment"
 * dialog.
 *
 * The dialog exposes two channels:
 *
 *   - `registrar` — capture on an Android registrar tablet (e.g.
 *     REG-TAB-02) standing at a registration station;
 *   - `local` — capture on the local Web camera-station (operator's
 *     desktop USB camera with a second-monitor capture window).
 *
 * Each channel carries its own device state. The snapshot also
 * carries a top-level `currentAttempt` block — when an enrollment
 * attempt is already running for someone, the "Retry" action is
 * disabled with a visible reason.
 *
 * Five scenarios are required by spec, all locally defined here so
 * the broader `MockScenario` union (empty / normal /
 * exam-in-progress / violations-detected / service-degraded) does
 * not have to learn about enrollment-only states.
 */

export type EnrollmentScenario =
  | "registrar-online"
  | "registrar-offline"
  | "local-camera-available"
  | "local-camera-unavailable"
  | "attempt-active";

export type EnrollmentRegistrarState =
  | "online-assigned"
  | "online-idle"
  | "offline";

export type RegistrarChannelState = {
  state: EnrollmentRegistrarState;
  /** Tablet device id, e.g. `REG-TAB-02`. */
  deviceId: string;
  /** Operator-friendly station label, e.g. `Registration B · NODE-A2`. */
  station: string;
  /** Device name, e.g. `Registrar tablet — Station B`. */
  deviceName: string;
  /** Last contact, e.g. `2s ago`. */
  lastSeen: string;
  /** Power + network summary, e.g. `84% · Wi-Fi local`. */
  batteryNetwork: string;
};

export type LocalCameraStateKind = "available" | "unavailable";

export type LocalCameraChannelState = {
  state: LocalCameraStateKind;
  /** Camera model, e.g. `Logitech BRIO`. */
  cameraName: string;
  /** Short status, e.g. `Camera detected` or `No camera detected`. */
  statusLabel: string;
  /** Whether browser permission has already been granted (mock). */
  permissionGranted: boolean;
  /**
   * Operator-facing copy explaining where capture will happen.
   * Reference shows "Permission granted on this PC. Capture opens
   * in the second-monitor window — the console stays on this
   * screen."
   */
  secondMonitorCopy: string;
};

export type EnrollmentAttempt = {
  /** When set, "Retry" is disabled and `reason` is displayed. */
  active: boolean;
  /** Human-readable reason text shown next to the disabled Retry. */
  reason: string;
};

export type EnrollmentChannelsSnapshot = {
  scenario: EnrollmentScenario;
  registrar: RegistrarChannelState;
  local: LocalCameraChannelState;
  currentAttempt: EnrollmentAttempt;
};
