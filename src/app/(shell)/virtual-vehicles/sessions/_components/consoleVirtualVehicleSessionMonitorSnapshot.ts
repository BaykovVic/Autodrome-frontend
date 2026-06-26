/**
 * Console-shaped session monitor snapshot for a single virtual
 * vehicle session. Surfaces runtime status cards + event log so
 * operators can monitor running/paused/stopped sessions without
 * the live API integration. View-model field names mirror the
 * planned canonical `virtual-vehicle-service-session-event-log-
 * baseline` shape so Track 3 mapping drops in without
 * restructuring.
 */

export type ConsoleSessionState =
  | "running"
  | "paused"
  | "stopped"
  | "starting"
  | "degraded"
  | "unknown";

export type ConsoleSessionEventSeverity =
  | "info"
  | "warning"
  | "error"
  | "telemetry";

export type ConsoleSessionEvent = {
  id: string;
  /** ISO timestamp of the event. */
  at: string;
  severity: ConsoleSessionEventSeverity;
  severityLabel: string;
  /**
   * Canonical event kind (mirrors backend event-log baseline:
   * `sessionStarted` / `sessionPaused` / `sessionResumed` /
   * `sessionStopped` / `telemetryTick` / `degraded` /
   * `commandRejected` / etc).
   */
  kind: string;
  /** Operator-visible label. */
  label: string;
  detail: string;
};

export type ConsoleSessionRuntimeCard = {
  id: string;
  title: string;
  value: string;
  /** Optional canonical token chip (e.g. `wifi`, `simulator`). */
  canonical?: string;
  variant: "info" | "success" | "warning" | "danger" | "neutral";
};

export type ConsoleVirtualVehicleSessionMonitor = {
  /** Virtual vehicle / session id (operator-facing). */
  sessionId: string;
  vehicleLabel: string;
  state: ConsoleSessionState;
  stateLabel: string;
  startedAt: string;
  lastTelemetryAt: string;
  scenarioId: string;
  scenarioLabel: string;
  source: string;
  sourceLabel: string;
  runtimeCards: ConsoleSessionRuntimeCard[];
  events: ConsoleSessionEvent[];
  /** Operator audit notes. */
  notes?: string;
};

export const SESSION_STATE_LABELS: Record<ConsoleSessionState, string> = {
  running: "running",
  paused: "paused",
  stopped: "stopped",
  starting: "starting",
  degraded: "degraded",
  unknown: "unknown",
};

export const SESSION_EVENT_SEVERITY_LABELS: Record<
  ConsoleSessionEventSeverity,
  string
> = {
  info: "info",
  warning: "warning",
  error: "error",
  telemetry: "telemetry",
};
