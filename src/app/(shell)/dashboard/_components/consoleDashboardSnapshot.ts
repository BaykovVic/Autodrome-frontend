/**
 * Console dashboard snapshot shape. All fields are derived from
 * mock fixtures (per `MockScenario`). When backend ships real
 * dashboard read models, each block can be swapped for a typed
 * adapter call without touching the widget components.
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
    id: string;
    site: string;
    lastRefresh: string;
  };
  degradedNotice?: DashboardDegradedNotice;
  serviceHealth: DashboardServiceRow[];
  database: DatabaseReadiness;
  media: MediaStorage;
  vehicleTelemetry: VehicleTelemetry;
  outbox: OutboxBacklog;
  nodeOps: NodeOperationsItem[];
};
