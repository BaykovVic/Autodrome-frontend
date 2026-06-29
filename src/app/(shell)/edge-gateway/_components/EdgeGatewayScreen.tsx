"use client";

import { useState } from "react";

import {
  ApiErrorView,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";

import {
  EDGE_GATEWAY_GAP_LABELS,
  EDGE_GATEWAY_HEALTH_LABELS,
  EDGE_UPSTREAM_HEARTBEAT_GAP_LABELS,
  deriveEdgeGatewayHealth,
  deriveForwardGap,
  deriveUpstreamHeartbeatGap,
  type ConsoleEdgeGatewayGap,
  type ConsoleEdgeGatewayHealth,
  type ConsoleEdgeGatewaySnapshot,
  type ConsoleEdgeUpstreamHeartbeatGap,
  type ConsoleGatewayPhase,
} from "./consoleEdgeGateway";
import {
  useConsoleEdgeGateway,
  type ConsoleEdgeGatewayLoader,
} from "./useConsoleEdgeGateway";

import styles from "./EdgeGatewayScreen.module.css";

type Props = {
  loader?: ConsoleEdgeGatewayLoader;
  /**
   * Optional clock override for tests so the forward / heartbeat
   * gap badges are deterministic. Defaults to `new Date()` at the
   * time of render.
   */
  nowProvider?: () => Date;
};

function forwardGapBadge(g: ConsoleEdgeGatewayGap): StatusBadgeVariant {
  if (g === "fresh") return "success";
  if (g === "stale") return "warning";
  return "neutral";
}

function forwardGapDot(g: ConsoleEdgeGatewayGap): StatusDotVariant {
  if (g === "fresh") return "online";
  if (g === "stale") return "degraded";
  return "standby";
}

function heartbeatGapBadge(
  g: ConsoleEdgeUpstreamHeartbeatGap,
): StatusBadgeVariant {
  if (g === "fresh") return "success";
  if (g === "stale") return "warning";
  if (g === "unreachable") return "danger";
  return "neutral";
}

function heartbeatGapDot(
  g: ConsoleEdgeUpstreamHeartbeatGap,
): StatusDotVariant {
  if (g === "fresh") return "online";
  if (g === "stale") return "degraded";
  if (g === "unreachable") return "offline";
  return "standby";
}

function phaseDot(p: ConsoleGatewayPhase): StatusDotVariant {
  if (p === "forwarding") return "online";
  if (p === "paused" || p === "bootstrapping") return "degraded";
  return "offline";
}

function phaseBadge(p: ConsoleGatewayPhase): StatusBadgeVariant {
  if (p === "forwarding") return "success";
  if (p === "paused" || p === "bootstrapping") return "warning";
  return "danger";
}

function healthBadge(
  h: ConsoleEdgeGatewayHealth,
): StatusBadgeVariant {
  if (h === "ok") return "success";
  if (h === "queueBacklog") return "warning";
  if (h === "upstreamUnreachable") return "warning";
  return "danger";
}

function healthDot(h: ConsoleEdgeGatewayHealth): StatusDotVariant {
  if (h === "ok") return "online";
  if (h === "queueBacklog" || h === "upstreamUnreachable") {
    return "degraded";
  }
  return "offline";
}

export function EdgeGatewayScreen({ loader, nowProvider }: Props) {
  const state = useConsoleEdgeGateway(loader);
  // Capture the clock once on mount so the gap classifiers stay
  // deterministic across renders. Test injection happens via the
  // `nowProvider` prop; production calls `new Date()` once.
  const [now] = useState<Date>(() =>
    nowProvider ? nowProvider() : new Date(),
  );

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="Edge gateway monitoring"
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading edge gateway" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="Edge gateway monitoring"
      >
        <div className={styles.loadingPad}>
          <ApiErrorView
            error={state.fatalError}
            onRetry={state.reload}
          />
        </div>
      </section>
    );
  }

  if (!state.snapshot) return null;
  const snapshot: ConsoleEdgeGatewaySnapshot = state.snapshot;
  const health = deriveEdgeGatewayHealth(snapshot);
  const forwardGap = deriveForwardGap(snapshot, now);
  const heartbeatGap = deriveUpstreamHeartbeatGap(snapshot, now);

  return (
    <section
      className={styles.screen}
      aria-label="Edge gateway monitoring"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>
          Vehicle edge gateway
          <span
            className={styles.sourceChip}
            aria-label="Vehicle source — real hardware edge gateway"
          >
            (realHardwareEdge)
          </span>
        </h1>
        <p className={styles.subtitle}>
          Live monitoring view of the on-vehicle edge gateway:
          parser identity, forward queue depth, last forwarded
          batch, and upstream reachability. Raw serial frames are
          not surfaced here — they remain inside the
          parser/forward boundary.
        </p>
      </header>

      <div
        className={styles.healthBanner}
        role="status"
        aria-label="Edge gateway integration health"
      >
        <StatusDot variant={healthDot(health)} halo={false} />
        <StatusBadge variant={healthBadge(health)}>
          {EDGE_GATEWAY_HEALTH_LABELS[health]}
        </StatusBadge>
        {snapshot.statusError ? (
          <span className={styles.error}>{snapshot.statusError}</span>
        ) : null}
      </div>

      <div className={styles.body}>
        <section
          className={styles.card}
          aria-label="Gateway runtime status"
        >
          <div className={styles.cardTitle}>Runtime</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusDot variant={phaseDot(snapshot.phase)} halo={false} />
            <StatusBadge variant={phaseBadge(snapshot.phase)}>
              {snapshot.phaseLabel}
            </StatusBadge>
          </div>
          <dl className={styles.metaGrid}>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Gateway id</span>
              <span className={styles.metaValue}>{snapshot.gatewayId}</span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Observed at</span>
              <span className={styles.metaValue}>{snapshot.observedAt}</span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Parser</span>
              <span className={styles.metaValue}>
                {snapshot.parser.name}
                {snapshot.parser.version
                  ? ` · v${snapshot.parser.version}`
                  : ""}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Upstream</span>
              <span className={styles.metaValue}>
                {snapshot.upstream
                  ? snapshot.upstream.reachable
                    ? `reachable · last heartbeat ${snapshot.upstream.lastHeartbeatAt ?? "—"}`
                    : "unreachable"
                  : "—"}
              </span>
            </div>
          </dl>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            role="status"
            aria-label="Upstream heartbeat gap"
          >
            <StatusDot
              variant={heartbeatGapDot(heartbeatGap)}
              halo={false}
            />
            <StatusBadge variant={heartbeatGapBadge(heartbeatGap)}>
              {EDGE_UPSTREAM_HEARTBEAT_GAP_LABELS[heartbeatGap]}
            </StatusBadge>
          </div>
        </section>

        <section
          className={styles.card}
          aria-label="Forward queue status"
        >
          <div className={styles.cardTitle}>Forward queue</div>
          <dl className={styles.metaGrid}>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Pending batches</span>
              <span className={styles.metaValue}>
                {snapshot.queue.pendingBatches}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Last forward</span>
              <span className={styles.metaValue}>
                {snapshot.queue.lastForwardedAt ?? "—"}
              </span>
            </div>
            <div className={styles.metaCell} style={{ gridColumn: "1 / -1" }}>
              <span className={styles.metaLabel}>Last batch id</span>
              <span className={styles.metaValue}>
                {snapshot.queue.lastForwardedBatchId ?? "—"}
              </span>
            </div>
          </dl>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            role="status"
            aria-label="Forward queue gap"
          >
            <StatusDot
              variant={forwardGapDot(forwardGap)}
              halo={false}
            />
            <StatusBadge variant={forwardGapBadge(forwardGap)}>
              {EDGE_GATEWAY_GAP_LABELS[forwardGap]}
            </StatusBadge>
          </div>
        </section>
      </div>
    </section>
  );
}
