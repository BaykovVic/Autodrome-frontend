/**
 * Console-shaped vehicle-edge-gateway monitoring snapshot.
 *
 * Per spec rules:
 *   - "Не отображаем raw serial frames как domain data" — view-model
 *     surfaces parser identity (name+version), forward queue depth,
 *     and last-forward timestamps; raw serial bytes / port / baud
 *     are intentionally absent (backend boundary).
 *   - "Визуально отделяем real hardware от simulator source" — the
 *     screen renders an explicit `(realHardwareEdge)` source chip
 *     so the operator cannot confuse this monitoring view with the
 *     RPi emulator surface.
 *   - "Hardware parser backend отдельно" — UI читает только
 *     canonical `EdgeRuntimeStatus`, никакого raw serial dispatch
 *     с frontend.
 */

export type ConsoleGatewayPhase =
  | "bootstrapping"
  | "forwarding"
  | "paused"
  | "failed";

export const GATEWAY_PHASE_LABELS: Record<
  ConsoleGatewayPhase,
  string
> = {
  bootstrapping: "Bootstrapping",
  forwarding: "Forwarding",
  paused: "Paused",
  failed: "Failed",
};

export type ConsoleGatewayParser = {
  name: string;
  version?: string;
};

export type ConsoleGatewayQueue = {
  pendingBatches: number;
  lastForwardedAt?: string;
  lastForwardedBatchId?: string;
};

export type ConsoleGatewayUpstream = {
  reachable: boolean;
  lastHeartbeatAt?: string;
};

export type ConsoleEdgeGatewaySnapshot = {
  gatewayId: string;
  phase: ConsoleGatewayPhase;
  phaseLabel: string;
  parser: ConsoleGatewayParser;
  queue: ConsoleGatewayQueue;
  upstream?: ConsoleGatewayUpstream;
  observedAt: string;
  /** Captured fetch error for the runtime endpoint (degraded panel). */
  statusError?: string;
};

export type ConsoleEdgeGatewayHealth =
  | "ok"
  | "queueBacklog"
  | "upstreamUnreachable"
  | "disconnected"
  | "failed";

export const EDGE_GATEWAY_HEALTH_LABELS: Record<
  ConsoleEdgeGatewayHealth,
  string
> = {
  ok: "Forwarding healthy",
  queueBacklog: "Forwarding with queue backlog",
  upstreamUnreachable: "Upstream unreachable",
  disconnected: "Gateway disconnected",
  failed: "Gateway failed",
};

/**
 * Aggregate health classifier — derives single operator-facing
 * health badge from gateway phase + upstream reachability + queue
 * depth + presence of a status fetch error.
 *
 * Precedence (worst-case-wins):
 *   1. `disconnected` — `statusError` present (we cannot even read
 *     the status endpoint).
 *   2. `failed` — phase=failed.
 *   3. `upstreamUnreachable` — upstream.reachable === false.
 *   4. `queueBacklog` — pendingBatches > 0 (backend is still
 *     working through the queue).
 *   5. `ok` — everything else (forwarding/paused/bootstrapping
 *     without backlog).
 */
export function deriveEdgeGatewayHealth(
  snapshot: ConsoleEdgeGatewaySnapshot,
): ConsoleEdgeGatewayHealth {
  if (snapshot.statusError) return "disconnected";
  if (snapshot.phase === "failed") return "failed";
  if (snapshot.upstream && snapshot.upstream.reachable === false) {
    return "upstreamUnreachable";
  }
  if (snapshot.queue.pendingBatches > 0) return "queueBacklog";
  return "ok";
}

/**
 * Forward-queue gap classifier — operator-friendly indicator of how
 * fresh the upstream forward path is.
 */
export type ConsoleEdgeGatewayGap = "fresh" | "stale" | "noForwardYet";

export const EDGE_GATEWAY_GAP_LABELS: Record<
  ConsoleEdgeGatewayGap,
  string
> = {
  fresh: "Last forward < 30 s ago",
  stale: "Last forward > 30 s ago",
  noForwardYet: "No forward observed yet",
};

export function deriveForwardGap(
  snapshot: ConsoleEdgeGatewaySnapshot,
  now: Date,
): ConsoleEdgeGatewayGap {
  const last = snapshot.queue.lastForwardedAt;
  if (!last) return "noForwardYet";
  const ts = Date.parse(last);
  if (Number.isNaN(ts)) return "noForwardYet";
  const deltaMs = now.getTime() - ts;
  if (deltaMs < 30_000) return "fresh";
  return "stale";
}
