import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleDashboardSnapshot,
  PopulatedConsoleDashboardSnapshot,
  DashboardServiceRow,
} from "./consoleDashboardSnapshot";

const BASE_NODE = {
  id: "NODE-A2",
  site: "Autodrome test site",
  lastRefresh: "12:12:40",
};

/**
 * Local-node infrastructure rows shown in the Service health widget.
 *
 * These align with the dashboard service-row layout in the Autodrome
 * Console design reference: each row names a node infrastructure
 * component (API gateway, local database, media store, telemetry
 * broker, biometry service, auth/session) with a small operational
 * meta string and a coarse state. Per-scenario fixtures override
 * `state` / `badgeLabel` / `meta` to reflect degraded conditions.
 */
const BASE_SERVICE_HEALTHY: DashboardServiceRow[] = [
  {
    id: "api-gateway",
    name: "API gateway",
    meta: "12 ms",
    state: "healthy",
    badgeLabel: "Operational",
  },
  {
    id: "local-database",
    name: "Local database",
    meta: "PostgreSQL 16",
    state: "healthy",
    badgeLabel: "Ready",
  },
  {
    id: "media-store",
    name: "Media store",
    meta: "412 GB free",
    state: "healthy",
    badgeLabel: "Ready",
  },
  {
    id: "telemetry-broker",
    name: "Telemetry broker",
    meta: "0 stale",
    state: "healthy",
    badgeLabel: "Operational",
  },
  {
    id: "biometry",
    name: "Biometry service",
    meta: "0.92 conf",
    state: "healthy",
    badgeLabel: "Operational",
  },
  {
    id: "auth-session",
    name: "Auth / session",
    meta: "local realm",
    state: "healthy",
    badgeLabel: "Operational",
  },
];

const NORMAL: PopulatedConsoleDashboardSnapshot = {
  node: BASE_NODE,
  serviceHealth: BASE_SERVICE_HEALTHY,
  database: {
    schemaReady: true,
    migrationLabel: "migration 0142",
    pendingWrites: 0,
    openSessions: 7,
    walQueueMb: 2.1,
    lastVacuum: "03:00",
  },
  media: {
    usedGb: 588,
    totalGb: 1000,
    segments: [
      { label: "Sealed", gb: 420 },
      { label: "Buffer", gb: 168 },
    ],
    summary: "Healthy",
  },
  vehicleTelemetry: {
    tiles: [
      { label: "Online", value: 5, tone: "online" },
      { label: "Degraded", value: 0, tone: "degraded" },
      { label: "Offline", value: 0, tone: "offline" },
      { label: "Standby", value: 1, tone: "standby" },
    ],
  },
  outbox: {
    queued: 0,
    status: "live",
    sparkline: [2, 1, 1, 0, 0],
    nextRetryNote: "Outbox flushed — no pending events.",
  },
  nodeOps: [
    { label: "Uptime", value: "6d 04:12", tone: "ok" },
    { label: "Last backup", value: "today 03:00", tone: "neutral" },
    { label: "Sync mode", value: "Live", tone: "ok" },
    {
      label: "Environment",
      value: "Local / production",
      tone: "ok",
    },
  ],
};

const VIOLATIONS_DETECTED: PopulatedConsoleDashboardSnapshot = {
  ...NORMAL,
  vehicleTelemetry: {
    tiles: [
      { label: "Online", value: 3, tone: "online" },
      { label: "Degraded", value: 1, tone: "degraded" },
      { label: "Offline", value: 1, tone: "offline" },
      { label: "Standby", value: 1, tone: "standby" },
    ],
    staleNote: "Stale: VEH-07 (42s), VEH-21 (14m)",
  },
  outbox: {
    queued: 4,
    status: "live",
    sparkline: [2, 3, 2, 4, 4],
    oldestEvent: "00:02:11",
    nextRetryNote: "Events being delivered — backlog is recent.",
  },
  database: {
    ...NORMAL.database,
    pendingWrites: 2,
    walQueueMb: 8.4,
  },
};

const EXAM_IN_PROGRESS: PopulatedConsoleDashboardSnapshot = {
  ...NORMAL,
  vehicleTelemetry: {
    tiles: [
      { label: "Online", value: 4, tone: "online" },
      { label: "Degraded", value: 0, tone: "degraded" },
      { label: "Offline", value: 0, tone: "offline" },
      { label: "Standby", value: 2, tone: "standby" },
    ],
  },
  media: {
    ...NORMAL.media,
    usedGb: 612,
    segments: [
      { label: "Sealed", gb: 420 },
      { label: "Buffer", gb: 192 },
    ],
  },
};

const SERVICE_DEGRADED: PopulatedConsoleDashboardSnapshot = {
  ...NORMAL,
  degradedNotice: {
    title: "Vehicle telemetry broker degraded",
    detail:
      "2 vehicles reporting stale data (VEH-07, VEH-21). Outbox sync paused — 14 events queued locally and will replay on recovery.",
    primaryAction: "Retry sync",
    secondaryAction: "View broker",
  },
  serviceHealth: BASE_SERVICE_HEALTHY.map((row) => {
    if (row.id === "telemetry-broker") {
      return {
        ...row,
        state: "degraded",
        badgeLabel: "Degraded",
        meta: "2 stale",
      };
    }
    if (row.id === "media-store") {
      return {
        ...row,
        state: "unknown",
        badgeLabel: "No probe data",
        meta: "no probe data",
      };
    }
    return row;
  }),
  vehicleTelemetry: {
    tiles: [
      { label: "Online", value: 3, tone: "online" },
      { label: "Degraded", value: 1, tone: "degraded" },
      { label: "Offline", value: 1, tone: "offline" },
      { label: "Standby", value: 1, tone: "standby" },
    ],
    staleNote: "Stale: VEH-07 (42s), VEH-21 (14m)",
  },
  outbox: {
    queued: 14,
    status: "paused",
    sparkline: [4, 7, 5, 10, 14],
    oldestEvent: "00:11:20",
    nextRetryNote: "Oldest event 00:11:20 · next retry on broker recovery",
  },
  database: {
    ...NORMAL.database,
    pendingWrites: 0,
    walQueueMb: 2.1,
  },
  nodeOps: [
    { label: "Uptime", value: "6d 04:12", tone: "ok" },
    { label: "Last backup", value: "today 03:00", tone: "neutral" },
    { label: "Sync mode", value: "Deferred", tone: "watch" },
    {
      label: "Environment",
      value: "Local / production",
      tone: "ok",
    },
  ],
};

const EMPTY: PopulatedConsoleDashboardSnapshot = {
  ...NORMAL,
  serviceHealth: BASE_SERVICE_HEALTHY.map((row) => ({
    ...row,
    state: "unknown",
    badgeLabel: "No data",
    meta: "no probe yet",
  })),
  database: {
    schemaReady: false,
    migrationLabel: "no migration applied",
    pendingWrites: 0,
    openSessions: 0,
    walQueueMb: 0,
    lastVacuum: "—",
  },
  media: {
    usedGb: 0,
    totalGb: 0,
    segments: [],
    summary: "Healthy",
  },
  vehicleTelemetry: {
    tiles: [
      { label: "Online", value: 0, tone: "online" },
      { label: "Degraded", value: 0, tone: "degraded" },
      { label: "Offline", value: 0, tone: "offline" },
      { label: "Standby", value: 0, tone: "standby" },
    ],
  },
  outbox: {
    queued: 0,
    status: "live",
    sparkline: [0, 0, 0, 0, 0],
    nextRetryNote: "No events in this scenario.",
  },
  nodeOps: [
    { label: "Uptime", value: "—", tone: "neutral" },
    { label: "Last backup", value: "—", tone: "neutral" },
    { label: "Sync mode", value: "—", tone: "neutral" },
    { label: "Environment", value: "—", tone: "neutral" },
  ],
};

export function consoleDashboardFor(
  scenario: MockScenario,
): ConsoleDashboardSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "exam-in-progress":
      return EXAM_IN_PROGRESS;
    case "violations-detected":
      return VIOLATIONS_DETECTED;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    default:
      return NORMAL;
  }
}
