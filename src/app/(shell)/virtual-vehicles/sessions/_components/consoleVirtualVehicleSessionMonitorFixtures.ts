import type {
  ConsoleSessionEvent,
  ConsoleSessionRuntimeCard,
  ConsoleVirtualVehicleSessionMonitor,
} from "./consoleVirtualVehicleSessionMonitorSnapshot";

function runtimeCardsRunning(): ConsoleSessionRuntimeCard[] {
  return [
    {
      id: "speed",
      title: "Speed",
      value: "47 km/h",
      canonical: "simulator",
      variant: "info",
    },
    {
      id: "telemetry-tick",
      title: "Telemetry tick",
      value: "10 Hz",
      canonical: "telemetryTick",
      variant: "success",
    },
    {
      id: "network",
      title: "Network",
      value: "Wi-Fi · 18 ms",
      canonical: "wifi",
      variant: "success",
    },
    {
      id: "scenario-version",
      title: "Scenario version",
      value: "v4",
      variant: "neutral",
    },
  ];
}

function runtimeCardsDegraded(): ConsoleSessionRuntimeCard[] {
  return [
    {
      id: "speed",
      title: "Speed",
      value: "12 km/h",
      canonical: "simulator",
      variant: "warning",
    },
    {
      id: "telemetry-tick",
      title: "Telemetry tick",
      value: "1.4 Hz",
      canonical: "telemetryTick",
      variant: "warning",
    },
    {
      id: "network",
      title: "Network",
      value: "Cellular · 420 ms",
      canonical: "cellular",
      variant: "warning",
    },
    {
      id: "scenario-version",
      title: "Scenario version",
      value: "v0.5",
      variant: "neutral",
    },
  ];
}

function eventsRunning(): ConsoleSessionEvent[] {
  return [
    {
      id: "ev-1",
      at: "2026-06-26T08:00:00Z",
      severity: "info",
      severityLabel: "info",
      kind: "sessionStarted",
      label: "Session started",
      detail: "Simulator agent #1 spawned in scenario SC-CITY-A.",
    },
    {
      id: "ev-2",
      at: "2026-06-26T08:01:14Z",
      severity: "info",
      severityLabel: "info",
      kind: "scenarioBound",
      label: "Scenario bound",
      detail: "SC-CITY-A v4 attached.",
    },
    {
      id: "ev-3",
      at: "2026-06-26T08:01:20Z",
      severity: "telemetry",
      severityLabel: "telemetry",
      kind: "telemetryTick",
      label: "Telemetry tick",
      detail: "Sequence #1 acknowledged.",
    },
    {
      id: "ev-4",
      at: "2026-06-26T09:34:11Z",
      severity: "telemetry",
      severityLabel: "telemetry",
      kind: "telemetryTick",
      label: "Telemetry tick",
      detail: "Sequence #56k acknowledged.",
    },
  ];
}

function eventsPaused(): ConsoleSessionEvent[] {
  return [
    {
      id: "ev-p-1",
      at: "2026-06-26T07:30:00Z",
      severity: "info",
      severityLabel: "info",
      kind: "sessionStarted",
      label: "Session started",
      detail: "Legacy replay session #14 attached.",
    },
    {
      id: "ev-p-2",
      at: "2026-06-26T07:50:00Z",
      severity: "warning",
      severityLabel: "warning",
      kind: "operatorPaused",
      label: "Operator paused",
      detail: "Manual pause — operator audit pending.",
    },
    {
      id: "ev-p-3",
      at: "2026-06-26T07:52:18Z",
      severity: "info",
      severityLabel: "info",
      kind: "sessionPaused",
      label: "Session paused",
      detail: "Pause acknowledged by runtime.",
    },
  ];
}

function eventsStopped(): ConsoleSessionEvent[] {
  return [
    {
      id: "ev-s-1",
      at: "2026-06-20T13:00:00Z",
      severity: "info",
      severityLabel: "info",
      kind: "sessionStarted",
      label: "Session started",
      detail: "Archived replay attached.",
    },
    {
      id: "ev-s-2",
      at: "2026-06-20T13:42:00Z",
      severity: "info",
      severityLabel: "info",
      kind: "sessionStopped",
      label: "Session stopped",
      detail: "Operator-initiated stop.",
    },
  ];
}

function eventsDegraded(): ConsoleSessionEvent[] {
  return [
    {
      id: "ev-d-1",
      at: "2026-06-26T06:00:00Z",
      severity: "info",
      severityLabel: "info",
      kind: "sessionStarted",
      label: "Session started",
      detail: "High-load stress harness attached.",
    },
    {
      id: "ev-d-2",
      at: "2026-06-26T08:00:00Z",
      severity: "warning",
      severityLabel: "warning",
      kind: "degraded",
      label: "Telemetry degraded",
      detail: "Tick rate dropped below 5 Hz threshold.",
    },
    {
      id: "ev-d-3",
      at: "2026-06-26T09:28:12Z",
      severity: "warning",
      severityLabel: "warning",
      kind: "degraded",
      label: "Telemetry degraded",
      detail: "Tick gap >20s; operator notified.",
    },
  ];
}

const FIXTURES: Record<string, ConsoleVirtualVehicleSessionMonitor> = {
  "VV-SIM-001": {
    sessionId: "VV-SIM-001",
    vehicleLabel: "Sim agent #1",
    state: "running",
    stateLabel: "running",
    startedAt: "2026-06-26T08:00:00Z",
    lastTelemetryAt: "2026-06-26T09:34:11Z",
    scenarioId: "SC-CITY-A",
    scenarioLabel: "City A · daylight",
    source: "simulator",
    sourceLabel: "Simulator",
    runtimeCards: runtimeCardsRunning(),
    events: eventsRunning(),
    notes: "Pilot dry run; do not stop without operator note.",
  },
  "VV-REPLAY-014": {
    sessionId: "VV-REPLAY-014",
    vehicleLabel: "Replay session #14",
    state: "paused",
    stateLabel: "paused",
    startedAt: "2026-06-26T07:30:00Z",
    lastTelemetryAt: "2026-06-26T07:52:18Z",
    scenarioId: "SC-RAMP-B",
    scenarioLabel: "Ramp B · merging",
    source: "legacyReplay",
    sourceLabel: "Legacy replay",
    runtimeCards: [
      {
        id: "speed",
        title: "Speed",
        value: "0 km/h (paused)",
        canonical: "legacyReplay",
        variant: "neutral",
      },
      {
        id: "telemetry-tick",
        title: "Telemetry tick",
        value: "— (paused)",
        canonical: "telemetryTick",
        variant: "neutral",
      },
      {
        id: "scenario-version",
        title: "Scenario version",
        value: "v2",
        variant: "neutral",
      },
    ],
    events: eventsPaused(),
  },
  "VV-SIM-DEGRADED": {
    sessionId: "VV-SIM-DEGRADED",
    vehicleLabel: "Sim agent · slow",
    state: "degraded",
    stateLabel: "degraded",
    startedAt: "2026-06-26T06:00:00Z",
    lastTelemetryAt: "2026-06-26T09:28:12Z",
    scenarioId: "SC-HIGH-LOAD",
    scenarioLabel: "High-load stress",
    source: "simulator",
    sourceLabel: "Simulator",
    runtimeCards: runtimeCardsDegraded(),
    events: eventsDegraded(),
    notes: "Telemetry stream behind threshold (>20s gap).",
  },
  "VV-REPLAY-OLD": {
    sessionId: "VV-REPLAY-OLD",
    vehicleLabel: "Replay session · archived",
    state: "stopped",
    stateLabel: "stopped",
    startedAt: "2026-06-20T13:00:00Z",
    lastTelemetryAt: "2026-06-20T13:42:00Z",
    scenarioId: "SC-LOOP-CITY",
    scenarioLabel: "City loop · v0.4",
    source: "legacyReplay",
    sourceLabel: "Legacy replay",
    runtimeCards: [
      {
        id: "scenario-version",
        title: "Scenario version",
        value: "v0.4",
        variant: "neutral",
      },
    ],
    events: eventsStopped(),
  },
};

const NOT_FOUND: ConsoleVirtualVehicleSessionMonitor = {
  sessionId: "—",
  vehicleLabel: "—",
  state: "unknown",
  stateLabel: "unknown",
  startedAt: "—",
  lastTelemetryAt: "—",
  scenarioId: "—",
  scenarioLabel: "—",
  source: "—",
  sourceLabel: "—",
  runtimeCards: [],
  events: [],
};

export function consoleVirtualVehicleSessionMonitorFor(
  sessionId: string,
): ConsoleVirtualVehicleSessionMonitor {
  return FIXTURES[sessionId] ?? { ...NOT_FOUND, sessionId };
}

export const __SESSION_MONITOR_FIXTURE_KEYS__ = Object.keys(FIXTURES);
