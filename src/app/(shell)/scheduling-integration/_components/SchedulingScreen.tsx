"use client";

import { useMemo } from "react";

import {
  ApiErrorView,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components";
import {
  useConsoleScheduling,
  type ConsoleSchedulingLoader,
} from "./useConsoleScheduling";
import type {
  ConsoleIntegrationStatus,
  ConsoleScheduleStatus,
  ConsoleSchedulingSnapshot,
} from "./consoleSchedulingSnapshot";
import styles from "../../reference-data/_components/ReferenceDataScreen.module.css";

function scheduleBadge(s: ConsoleScheduleStatus | null): StatusBadgeVariant {
  switch (s) {
    case "completed":
      return "success";
    case "scheduled":
      return "info";
    case "rescheduled":
      return "warning";
    case "cancelled":
    default:
      return "neutral";
  }
}

function integrationBadge(
  s: ConsoleIntegrationStatus,
): StatusBadgeVariant {
  switch (s) {
    case "ok":
      return "success";
    case "degraded":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

type Props = {
  snapshotOverride?: ConsoleSchedulingSnapshot;
  /** Injected loader (tests). Live reads scheduling-integration-service. */
  loader?: ConsoleSchedulingLoader;
};

export function SchedulingScreen({ snapshotOverride, loader }: Props) {
  // Memoised so a fresh identity per render cannot retrigger the hook.
  const effectiveLoader = useMemo(
    () => (snapshotOverride ? () => snapshotOverride : loader),
    [snapshotOverride, loader],
  );
  const state = useConsoleScheduling(effectiveLoader);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="Scheduling integration workspace"
      >
        <Skeleton lines={6} label="Loading scheduling integration" />
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="Scheduling integration workspace"
      >
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      </section>
    );
  }

  const snap = state.snapshot;
  if (!snap) {
    return (
      <section
        className={styles.screen}
        aria-label="Scheduling integration workspace"
      >
        <EmptyState
          title="No scheduling data"
          description="Live and mock loaders both returned no data."
        />
      </section>
    );
  }

  return (
    <section
      className={styles.screen}
      aria-label="Scheduling integration workspace"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>Scheduling &amp; integration</h1>
        <p className={styles.subtitle}>
          {snap.schedules.length} schedules · {snap.integrations.length}{" "}
          integrations · canonical
          `scheduling-integration-service` view-model.
        </p>
      </header>

      {snap.degradedNote ? (
        <p
          role="status"
          aria-label="Scheduling degraded note"
          style={{
            margin: "12px 20px 0",
            padding: "10px 12px",
            border: "var(--border-width) solid var(--color-border-strong)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface-soft)",
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {snap.degradedNote}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="schedules-title"
        >
          <h2 id="schedules-title" className={styles.sectionTitle}>
            Schedules ({snap.schedules.length})
          </h2>
          {snap.schedules.length === 0 ? (
            <p className={styles.notesText}>No schedules returned.</p>
          ) : (
            <table className={styles.table} aria-label="Schedule list">
              <thead>
                <tr>
                  <th>Schedule id</th>
                  <th>Candidate</th>
                  <th>Exam</th>
                  <th>Starts at</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {snap.schedules.map((s) => (
                  <tr key={s.scheduleId}>
                    <td className={styles.cellMono}>{s.scheduleId}</td>
                    <td className={styles.cellMono}>{s.candidateRef}</td>
                    <td className={styles.cellMono}>{s.examRef}</td>
                    <td className={styles.cellMono}>{s.startsAt}</td>
                    <td>
                      <StatusBadge variant={scheduleBadge(s.status)}>
                        {s.statusLabel}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="integrations-title"
        >
          <h2 id="integrations-title" className={styles.sectionTitle}>
            Integrations ({snap.integrations.length})
          </h2>
          {snap.integrations.length === 0 ? (
            <p className={styles.notesText}>
              No integrations configured.
            </p>
          ) : (
            <table
              className={styles.table}
              aria-label="Integration status"
            >
              <thead>
                <tr>
                  <th>Integration id</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Last import</th>
                  <th>Pending</th>
                  <th>Last error</th>
                </tr>
              </thead>
              <tbody>
                {snap.integrations.map((i) => (
                  <tr key={i.integrationId}>
                    <td className={styles.cellMono}>{i.integrationId}</td>
                    <td>{i.source}</td>
                    <td>
                      <StatusBadge variant={integrationBadge(i.status)}>
                        {i.statusLabel}
                      </StatusBadge>
                    </td>
                    <td className={styles.cellMono}>{i.lastImportAt}</td>
                    <td className={styles.cellMono}>{i.pendingItems}</td>
                    <td className={styles.notesText}>
                      {i.lastError ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </section>
  );
}
