/**
 * Console dashboard snapshot shape.
 *
 * Two sources fill this shape:
 *
 *   - mock mode — scenario-keyed fixtures (every block populated);
 *   - live mode — the `api-gateway-bff` dashboard read models
 *     (`GET /dashboard/admin`, `GET /dashboard/dispatcher`).
 *
 * The BFF read models cover service health and alerts (plus the
 * dispatcher exam / vehicle / equipment summary). They do NOT carry a
 * database-readiness, media-storage, telemetry or outbox read model.
 * Those blocks are therefore nullable: in live mode they are `null`
 * and the dashboard renders an explicit "no data from backend" tile
 * instead of inventing a plausible value. Widgets keep receiving
 * fully-populated data — the null check happens once, in the
 * dashboard composer.
 */

export type ServiceHealthState =
  | "healthy"
  | "degraded"
  | "down"
  | "unknown";

export type DashboardServiceRow = {
  id: string;
  name: string;
  meta?: string;
  state: ServiceHealthState;
  badgeLabel: string;
};

export type DashboardDegradedNotice = {
  title: string;
  detail: string;
  primaryAction?: string;
  secondaryAction?: string;
};

export type DatabaseReadiness = {
  schemaReady: boolean;
  migrationLabel: string;
  pendingWrites: number;
  openSessions: number;
  walQueueMb: number;
  lastVacuum: string;
};

export type MediaStorageSegment = {
  label: string;
  gb: number;
};

export type MediaStorage = {
  usedGb: number;
  totalGb: number;
  segments: MediaStorageSegment[];
  /**
   * Overall health summary string. Three canonical values today:
   * "Healthy" / "Watch" / "Degraded".
   */
  summary: "Healthy" | "Watch" | "Degraded";
};

export type VehicleTelemetryTile = {
  label: string;
  value: number;
  tone: "online" | "degraded" | "offline" | "standby";
};

export type VehicleTelemetry = {
  tiles: VehicleTelemetryTile[];
  staleNote?: string;
};

export type OutboxBacklog = {
  queued: number;
  oldestEvent?: string;
  status: "live" | "paused";
  sparkline: number[];
  nextRetryNote?: string;
};

export type NodeOperationsItem = {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "watch" | "alert";
};

export type ConsoleDashboardSnapshot = {
  node: {
    /** `null` when the backend read model does not report node identity. */
    id: string | null;
    site: string | null;
    lastRefresh: string;
  };
  degradedNotice?: DashboardDegradedNotice;
  serviceHealth: DashboardServiceRow[];
  /** `null` — no backend read model for this block (see file docstring). */
  database: DatabaseReadiness | null;
  media: MediaStorage | null;
  vehicleTelemetry: VehicleTelemetry | null;
  outbox: OutboxBacklog | null;
  nodeOps: NodeOperationsItem[] | null;
};

/**
 * A snapshot with every block populated — the shape mock fixtures
 * produce. Assignable to `ConsoleDashboardSnapshot`; used so fixture
 * spreads keep their non-nullable field types.
 */
export type PopulatedConsoleDashboardSnapshot = Omit<
  ConsoleDashboardSnapshot,
  | "node"
  | "database"
  | "media"
  | "vehicleTelemetry"
  | "outbox"
  | "nodeOps"
> & {
  node: { id: string; site: string; lastRefresh: string };
  database: DatabaseReadiness;
  media: MediaStorage;
  vehicleTelemetry: VehicleTelemetry;
  outbox: OutboxBacklog;
  nodeOps: NodeOperationsItem[];
};
