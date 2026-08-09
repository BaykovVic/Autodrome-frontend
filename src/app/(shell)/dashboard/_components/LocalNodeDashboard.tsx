"use client";

import { useCallback, useMemo } from "react";

import { classifyError } from "@/api/error-taxonomy";
import { ApiErrorView, DegradedState, Skeleton } from "@/components";

import { useOptionalSession } from "../../_session/SessionProvider";
import { DashboardHeader } from "./DashboardHeader";
import { DatabaseReadinessWidget } from "./DatabaseReadinessWidget";
import { DegradedNoticeBanner } from "./DegradedNoticeBanner";
import { MediaStorageWidget } from "./MediaStorageWidget";
import { NoBackendDataWidget } from "./NoBackendDataWidget";
import { NodeOperationsWidget } from "./NodeOperationsWidget";
import { OutboxBacklogWidget } from "./OutboxBacklogWidget";
import { ServiceHealthWidget } from "./ServiceHealthWidget";
import { VehicleTelemetryWidget } from "./VehicleTelemetryWidget";
import { defaultConsoleDashboardLoader } from "./defaultConsoleDashboardLoader";
import {
  useConsoleDashboard,
  type ConsoleDashboardLoader,
} from "./useConsoleDashboard";
import styles from "./LocalNodeDashboard.module.css";

type Props = {
  /**
   * Optional snapshot loader (for tests / SSR). When omitted, the
   * default loader reads the live BFF dashboard read model (selected
   * by the current session roles) or, in mock mode, scenario-keyed
   * fixtures.
   */
  loader?: ConsoleDashboardLoader;
};

export function LocalNodeDashboard({ loader }: Props) {
  const session = useOptionalSession();
  const roles =
    session?.phase === "authenticated" ? session.actor.roles : [];
  // Stable dependency: the loader must not change identity on every
  // render or the dashboard would refetch in a loop.
  const rolesKey = roles.join(",");
  const roleLoader = useCallback(
    () => defaultConsoleDashboardLoader(rolesKey ? rolesKey.split(",") : []),
    [rolesKey],
  );
  const effectiveLoader = useMemo(
    () => loader ?? roleLoader,
    [loader, roleLoader],
  );

  const state = useConsoleDashboard(effectiveLoader);

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
  // A refresh that failed while a snapshot is already on screen: show
  // an honest banner over the last known data instead of silently
  // presenting it as current. Non-degraded failures (401 / 403) get
  // the error panel, which routes 401 to sign-in.
  const failure = state.fatalError
    ? classifyError(state.fatalError)
    : null;

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

      {failure ? (
        failure.uiKind === "degraded-banner" ? (
          <DegradedState
            service="api-gateway-bff"
            description={`${failure.description} Showing the last known snapshot.`}
            onRetry={state.reload}
          />
        ) : (
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        )
      ) : null}

      {snapshot.degradedNotice ? (
        <DegradedNoticeBanner notice={snapshot.degradedNotice} />
      ) : null}

      <div className={styles.grid}>
        <ServiceHealthWidget services={snapshot.serviceHealth} />
        {snapshot.database ? (
          <DatabaseReadinessWidget data={snapshot.database} />
        ) : (
          <NoBackendDataWidget title="Database readiness" />
        )}
        {snapshot.media ? (
          <MediaStorageWidget data={snapshot.media} />
        ) : (
          <NoBackendDataWidget title="Media storage" />
        )}
        {snapshot.vehicleTelemetry ? (
          <VehicleTelemetryWidget data={snapshot.vehicleTelemetry} />
        ) : (
          <NoBackendDataWidget title="Vehicle telemetry" />
        )}
        {snapshot.outbox ? (
          <OutboxBacklogWidget data={snapshot.outbox} />
        ) : (
          <NoBackendDataWidget title="Outbox backlog" />
        )}
        {snapshot.nodeOps ? (
          <NodeOperationsWidget items={snapshot.nodeOps} />
        ) : (
          <NoBackendDataWidget title="Node operations" />
        )}
      </div>
    </section>
  );
}
