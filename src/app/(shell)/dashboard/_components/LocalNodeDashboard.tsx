"use client";

import { ApiErrorView, Skeleton } from "@/components";
import { DashboardHeader } from "./DashboardHeader";
import { DatabaseReadinessWidget } from "./DatabaseReadinessWidget";
import { DegradedNoticeBanner } from "./DegradedNoticeBanner";
import { MediaStorageWidget } from "./MediaStorageWidget";
import { NodeOperationsWidget } from "./NodeOperationsWidget";
import { OutboxBacklogWidget } from "./OutboxBacklogWidget";
import { ServiceHealthWidget } from "./ServiceHealthWidget";
import { VehicleTelemetryWidget } from "./VehicleTelemetryWidget";
import {
  useConsoleDashboard,
  type ConsoleDashboardLoader,
} from "./useConsoleDashboard";
import styles from "./LocalNodeDashboard.module.css";

type Props = {
  /**
   * Optional snapshot loader (for tests / SSR). When omitted, the
   * default loader reads scenario-keyed fixtures via
   * `defaultConsoleDashboardLoader`.
   */
  loader?: ConsoleDashboardLoader;
};

export function LocalNodeDashboard({ loader }: Props) {
  const state = useConsoleDashboard(loader);

  if (state.loading || !state.snapshot) {
    return (
      <section
        className={styles.dashboard}
        aria-label="Local node dashboard"
      >
        <h1 className={styles.loadingTitle}>Local Node Dashboard</h1>
        {state.fatalError ? (
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        ) : (
          <Skeleton lines={6} label="Loading local node dashboard" />
        )}
      </section>
    );
  }

  const snapshot = state.snapshot;

  return (
    <section
      className={styles.dashboard}
      aria-label="Local node dashboard"
    >
      <DashboardHeader
        nodeId={snapshot.node.id}
        site={snapshot.node.site}
        lastRefresh={snapshot.node.lastRefresh}
        onReload={state.reload}
      />

      {snapshot.degradedNotice ? (
        <DegradedNoticeBanner notice={snapshot.degradedNotice} />
      ) : null}

      <div className={styles.grid}>
        <ServiceHealthWidget services={snapshot.serviceHealth} />
        <DatabaseReadinessWidget data={snapshot.database} />
        <MediaStorageWidget data={snapshot.media} />
        <VehicleTelemetryWidget data={snapshot.vehicleTelemetry} />
        <OutboxBacklogWidget data={snapshot.outbox} />
        <NodeOperationsWidget items={snapshot.nodeOps} />
      </div>
    </section>
  );
}
