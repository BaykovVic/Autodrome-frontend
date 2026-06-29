import {
  GATEWAY_PHASE_LABELS,
  type ConsoleEdgeGatewaySnapshot,
  type ConsoleGatewayPhase,
} from "./consoleEdgeGateway";

export type EdgeGatewayFixtureKind =
  | "forwarding"
  | "queue-backlog"
  | "upstream-unreachable"
  | "failed"
  | "paused"
  | "bootstrapping"
  | "disconnected";

const GATEWAY_ID = "55555555-5555-4555-8555-555555555555";

function snapshot(
  phase: ConsoleGatewayPhase,
  opts: {
    pendingBatches?: number;
    lastForwardedAt?: string;
    upstreamReachable?: boolean;
    lastHeartbeatAt?: string;
    statusError?: string;
  } = {},
): ConsoleEdgeGatewaySnapshot {
  return {
    gatewayId: GATEWAY_ID,
    phase,
    phaseLabel: GATEWAY_PHASE_LABELS[phase],
    parser: { name: "lite-line-parser", version: "1.4.0" },
    queue: {
      pendingBatches: opts.pendingBatches ?? 0,
      lastForwardedAt: opts.lastForwardedAt,
      lastForwardedBatchId: opts.lastForwardedAt
        ? "77777777-7777-4777-8777-777777777777"
        : undefined,
    },
    upstream: {
      reachable: opts.upstreamReachable ?? true,
      lastHeartbeatAt: opts.lastHeartbeatAt,
    },
    observedAt: "2026-06-29T08:00:00Z",
    statusError: opts.statusError,
  };
}

export function consoleEdgeGatewayFor(
  kind: EdgeGatewayFixtureKind,
): ConsoleEdgeGatewaySnapshot {
  switch (kind) {
    case "forwarding":
      return snapshot("forwarding", {
        pendingBatches: 0,
        lastForwardedAt: "2026-06-29T07:59:50Z",
        upstreamReachable: true,
        lastHeartbeatAt: "2026-06-29T07:59:55Z",
      });
    case "queue-backlog":
      return snapshot("forwarding", {
        pendingBatches: 12,
        lastForwardedAt: "2026-06-29T07:59:00Z",
        upstreamReachable: true,
        lastHeartbeatAt: "2026-06-29T07:59:55Z",
      });
    case "upstream-unreachable":
      return snapshot("forwarding", {
        pendingBatches: 4,
        lastForwardedAt: "2026-06-29T07:50:00Z",
        upstreamReachable: false,
      });
    case "failed":
      return snapshot("failed", {
        pendingBatches: 0,
        upstreamReachable: false,
      });
    case "paused":
      return snapshot("paused", {
        pendingBatches: 0,
        lastForwardedAt: "2026-06-29T07:30:00Z",
        upstreamReachable: true,
      });
    case "bootstrapping":
      return snapshot("bootstrapping", {
        pendingBatches: 0,
        upstreamReachable: true,
      });
    case "disconnected":
      return {
        gatewayId: "—",
        phase: "failed",
        phaseLabel: GATEWAY_PHASE_LABELS.failed,
        parser: { name: "—" },
        queue: { pendingBatches: 0 },
        upstream: { reachable: false },
        observedAt: "—",
        statusError: "edge gateway 503",
      };
  }
}
