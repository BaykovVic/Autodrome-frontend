"use client";

import { useMemo } from "react";

import {
  ApiErrorView,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components";
import type {
  ConsoleGeometrySnapshot,
  ConsoleGeometryStatus,
} from "./consoleGeometrySnapshot";
import {
  useConsoleGeometry,
  type ConsoleGeometryLoader,
} from "./useConsoleGeometry";
import styles from "../../reference-data/_components/ReferenceDataScreen.module.css";

function statusBadge(s: ConsoleGeometryStatus | null): StatusBadgeVariant {
  switch (s) {
    case "published":
      return "success";
    case "draft":
      return "info";
    case "archived":
    default:
      return "neutral";
  }
}

type Props = {
  snapshotOverride?: ConsoleGeometrySnapshot;
  /** Injected loader (tests). Live mode reads autodrome-geometry-service. */
  loader?: ConsoleGeometryLoader;
};

export function GeometryScreen({ snapshotOverride, loader }: Props) {
  // Memoised: see ReferenceDataScreen — a new loader identity each
  // render would retrigger the hook effect in a loop.
  const effectiveLoader = useMemo(
    () => (snapshotOverride ? () => snapshotOverride : loader),
    [snapshotOverride, loader],
  );
  const state = useConsoleGeometry(effectiveLoader);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="Autodrome geometry workspace"
      >
        <Skeleton lines={6} label="Loading autodrome geometry" />
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="Autodrome geometry workspace"
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
        aria-label="Autodrome geometry workspace"
      >
        <EmptyState
          title="No geometry data"
          description="Live and mock loaders both returned no data."
        />
      </section>
    );
  }

  return (
    <section
      className={styles.screen}
      aria-label="Autodrome geometry workspace"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>Autodrome geometry</h1>
        <p className={styles.subtitle}>
          {snap.entries.length} geometry entries · canonical
          `autodrome-geometry-service` versions.
        </p>
      </header>

      {snap.degradedNote ? (
        <p
          role="status"
          aria-label="Geometry degraded note"
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
          aria-labelledby="geometry-list-title"
        >
          <h2 id="geometry-list-title" className={styles.sectionTitle}>
            Geometry versions ({snap.entries.length})
          </h2>
          {snap.entries.length === 0 ? (
            <p className={styles.notesText}>
              No geometry versions returned.
            </p>
          ) : (
            <table
              className={styles.table}
              aria-label="Geometry versions"
            >
              <thead>
                <tr>
                  <th>Geometry id</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Published</th>
                  <th>Checksum</th>
                </tr>
              </thead>
              <tbody>
                {snap.entries.map((e) => (
                  <tr key={e.geometryId}>
                    <td className={styles.cellMono}>{e.geometryId}</td>
                    <td>{e.name}</td>
                    <td>
                      <StatusBadge variant={statusBadge(e.status)}>
                        {e.statusLabel}
                      </StatusBadge>
                    </td>
                    <td className={styles.cellMono}>
                      {e.version === null ? "—" : `v${e.version}`}
                    </td>
                    <td className={styles.cellMono}>
                      {e.publishedAt ?? "—"}
                    </td>
                    <td className={styles.cellMono}>
                      {e.checksumShort ?? "—"}
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
