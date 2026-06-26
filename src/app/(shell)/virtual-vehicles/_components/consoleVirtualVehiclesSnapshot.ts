/**
 * Console-shaped Virtual Vehicles snapshot (mock-first baseline).
 *
 * Virtual vehicles represent simulated/external test agents that
 * drive the autodrome scenarios without a physical vehicle bound
 * to a real Android device. Operators need to see:
 *
 *   - which virtual vehicles exist;
 *   - which source spawned them (`simulator` for synthetic
 *     scenario replay, `legacyReplay` for offline trajectory
 *     parser, `operatorManual` for live joystick-driven sessions);
 *   - which scenario they're bound to;
 *   - lifecycle state (`idle` / `running` / `paused` / `stopped`
 *     / `degraded`);
 *   - live-ready view-model boundary so the live API integration
 *     feature (Track 3) can drop in without restructuring the
 *     screen.
 *
 * Canonical virtual-vehicle-service contract is NOT yet generated
 * in this repo (live wiring is Track 3 conditional on backend
 * canonical OpenAPI). View-model field names mirror the planned
 * shape from `feature/virtual-vehicle-service-contracts-baseline.md`
 * so future mapper does not have to restructure the snapshot.
 */

export type ConsoleVirtualVehicleStatus =
  | "idle"
  | "running"
  | "paused"
  | "stopped"
  | "degraded";

/**
 * Source that produced the virtual vehicle session. Operator-
 * visible marker — operators must know whether a "vehicle"
 * is a synthetic simulator agent, a replayed trajectory, or a
 * live operator manual control session, because the trust /
 * audit semantics differ.
 *
 *   - `simulator` — autonomous synthetic agent (canonical
 *     virtual-vehicle-service scenario-driver).
 *   - `legacyReplay` — offline trajectory file replayed via
 *     legacy parsers (read-only, no live telemetry).
 *   - `operatorManual` — live operator joystick session.
 */
export type ConsoleVirtualVehicleSource =
  | "simulator"
  | "legacyReplay"
  | "operatorManual";

export type ConsoleVirtualVehicle = {
  id: string;
  /** Human-friendly handle assigned by operator/runtime. */
  label: string;
  source: ConsoleVirtualVehicleSource;
  /** Operator-friendly source label (rendered alongside canonical token). */
  sourceLabel: string;
  status: ConsoleVirtualVehicleStatus;
  statusLabel: string;
  /** Currently bound scenario id (if any) — `"—"` placeholder when idle. */
  scenarioId: string;
  /** Scenario display name resolved from catalog (Track 2 / feature 2). */
  scenarioLabel: string;
  /** Session start timestamp (ISO). `"—"` placeholder if not yet running. */
  startedAt: string;
  /** Last telemetry tick timestamp (ISO). `"—"` placeholder if no telemetry. */
  lastTelemetryAt: string;
  /** Optional operator audit note. */
  notes?: string;
};

export type ConsoleVirtualVehiclesSnapshot = {
  totals: {
    total: number;
    running: number;
    idle: number;
    degraded: number;
  };
  vehicles: ConsoleVirtualVehicle[];
};

/**
 * Operator-friendly source labels. Source values stay canonical;
 * label is rendered next to the canonical token as a monospace chip.
 */
export const VIRTUAL_VEHICLE_SOURCE_LABELS: Record<
  ConsoleVirtualVehicleSource,
  string
> = {
  simulator: "Simulator",
  legacyReplay: "Legacy replay",
  operatorManual: "Operator manual",
};

export const VIRTUAL_VEHICLE_STATUS_LABELS: Record<
  ConsoleVirtualVehicleStatus,
  string
> = {
  idle: "idle",
  running: "running",
  paused: "paused",
  stopped: "stopped",
  degraded: "degraded",
};
