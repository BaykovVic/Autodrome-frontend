"use client";

import { StatusBadge, type StatusBadgeVariant } from "@/components";
import { consoleGeometryFor } from "./consoleGeometryFixtures";
import type {
  ConsoleGeometrySnapshot,
  ConsoleGeometryStatus,
} from "./consoleGeometrySnapshot";
import styles from "../../reference-data/_components/ReferenceDataScreen.module.css";

function statusBadge(s: ConsoleGeometryStatus): StatusBadgeVariant {
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
};

export function GeometryScreen({ snapshotOverride }: Props) {
  const snap = snapshotOverride ?? consoleGeometryFor("normal");

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
                    <td className={styles.cellMono}>v{e.version}</td>
                    <td className={styles.cellMono}>
                      {e.publishedAt ?? "—"}
                    </td>
                    <td className={styles.cellMono}>{e.checksumShort}</td>
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
