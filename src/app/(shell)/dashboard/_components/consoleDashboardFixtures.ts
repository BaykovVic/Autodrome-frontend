import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleDashboardSnapshot,
} from "./consoleDashboardSnapshot";

const BASE_NODE = {
  id: "NODE-A2",
  site: "Autodrome test site",
  lastRefresh: "12:12:40",
};

const NORMAL: ConsoleDashboardSnapshot = {
  node: BASE_NODE,
  serviceHealth: [
    {
      id: "candidate",
      name: "Candidate service",
      meta: "v0.7.0",
      state: "healthy",
      badgeLabel: "ok",
    },
    {
      id: "vehicle",
      name: "Vehicle service",
      meta: "v0.7.0",
      state: "healthy",
      badgeLabel: "ok",
    },
    {
      id: "exam",
      name: "Exam service",
      meta: "v0.7.0",
      state: "healthy",
      badgeLabel: "ok",
    },
    {
      id: "exercise",
      name: "Exercise service",
      meta: "v0.7.0",
      state: "healthy",
      badgeLabel: "ok",
    },
    {
      id: "violation-rule",
      name: "Violation & rule service",
      meta: "v0.7.0",
      state: "healthy",
      badgeLabel: "ok",
    },
    {
      id: "media-archive",
      name: "Media archive service",
      meta: "v0.7.0",
      state: "healthy",
      badgeLabel: "ok",
    },
  ],
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

const VIOLATIONS_DETECTED: ConsoleDashboardSnapshot = {
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

const EXAM_IN_PROGRESS: ConsoleDashboardSnapshot = {
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

const SERVICE_DEGRADED: ConsoleDashboardSnapshot = {
  ...NORMAL,
  degradedNotice: {
    title: "Vehicle telemetry broker degraded",
    detail:
      "2 vehicles reporting stale data (VEH-07, VEH-21). Outbox sync paused — 14 events queued locally and will replay on recovery.",
    primaryAction: "Retry sync",
    secondaryAction: "View broker",
  },
  serviceHealth: NORMAL.serviceHealth.map((row) => {
    if (row.id === "vehicle") {
      return {
        ...row,
        state: "down",
        badgeLabel: "down",
        meta: "probe failed",
      };
    }
    if (row.id === "media-archive") {
      return {
        ...row,
        state: "unknown",
        badgeLabel: "unknown",
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

const EMPTY: ConsoleDashboardSnapshot = {
  ...NORMAL,
  serviceHealth: NORMAL.serviceHealth.map((row) => ({
    ...row,
    state: "unknown",
    badgeLabel: "no data",
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
