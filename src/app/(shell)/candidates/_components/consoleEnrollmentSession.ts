/**
 * Console-shaped enrollment session monitor snapshot.
 *
 * Backend has no canonical enrollment-session read model yet; this
 * surface stays on mock/data-adapter layer per spec. When backend
 * orchestration contracts land, the loader can switch to a typed
 * adapter call without changing the screen.
 *
 * Important separation:
 *
 *   - this is the **face-enrollment** session monitor — the one-time
 *     biometric template capture flow;
 *   - per-exam face verification / passive liveness lives elsewhere
 *     and is NOT mixed into this UI.
 *
 * Eight states per spec are tracked as a closed union so widgets can
 * exhaustively switch on every variant.
 */

export type EnrollmentSessionState =
  | "queued"
  | "accepted"
  | "capturing"
  | "ttl-warning"
  | "quality-failed"
  | "finalized"
  | "expired"
  | "cancelled";

export type EnrollmentSessionChannel = "registrar" | "local";

export type EnrollmentSessionTimelineEntry = {
  id: string;
  state: EnrollmentSessionState;
  label: string;
  note: string;
  time: string;
  /**
   * Visual tone for the timeline dot. Maps onto the existing
   * StatusDot variant palette so we don't introduce new colors.
   */
  tone: "online" | "degraded" | "offline" | "standby" | "unknown";
};

export type EnrollmentSession = {
  id: string;
  state: EnrollmentSessionState;
  /** Operator-facing copy for the current state, e.g. "Capturing". */
  stateLabel: string;
  /** Time-to-live string, e.g. `02:43` or `—` once finalized. */
  ttl: string;
  candidate: string;
  candidateId: string;
  channel: EnrollmentSessionChannel;
  channelLabel: string;
  targetDevice: string;
  deviceStation: string;
  lastEventAt: string;
  timeline: EnrollmentSessionTimelineEntry[];
};

export type EnrollmentSessionSnapshot = {
  scenario: EnrollmentSessionScenario;
  session: EnrollmentSession;
};

/**
 * Eight mock scenarios — one per spec timeline state. Each scenario
 * pins the session to that state and exposes the timeline up to and
 * including that state.
 */
export type EnrollmentSessionScenario =
  | "queued"
  | "accepted"
  | "capturing"
  | "ttl-warning"
  | "quality-failed"
  | "finalized"
  | "expired"
  | "cancelled";

/**
 * Terminal states block both Retry and Cancel — there is nothing left
 * to retry or cancel once the session has reached a final outcome.
 */
export const TERMINAL_STATES: ReadonlySet<EnrollmentSessionState> = new Set([
  "finalized",
  "expired",
  "cancelled",
]);

/**
 * Retry is meaningful only when the session has failed-but-recoverable
 * (quality issue, TTL warning) or is still in flight but the operator
 * wants to re-send the command.
 */
export const RETRY_ELIGIBLE: ReadonlySet<EnrollmentSessionState> = new Set([
  "queued",
  "accepted",
  "ttl-warning",
  "quality-failed",
]);

/**
 * Cancel is meaningful for any non-terminal state.
 */
export const CANCEL_ELIGIBLE: ReadonlySet<EnrollmentSessionState> = new Set([
  "queued",
  "accepted",
  "capturing",
  "ttl-warning",
  "quality-failed",
]);
