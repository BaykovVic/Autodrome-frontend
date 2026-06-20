"use client";

import { useState } from "react";

import { Button, EmptyState, StatusBadge } from "@/components";
import styles from "./LogsPanel.module.css";

export function LogsPanel() {
  const [exportRequestedAt, setExportRequestedAt] = useState<
    string | null
  >(null);

  return (
    <section className={styles.panel} aria-label="Logs and export">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Logs and export</h2>
          <p className={styles.subtitle}>
            Operator-facing log streams and export bundles. Export is
            preview-only until the local node API exposes a download
            endpoint.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() =>
              setExportRequestedAt(new Date().toISOString())
            }
          >
            Record log export request (preview)
          </Button>
        </div>
      </header>

      <EmptyState
        title="Recent logs are not connected yet"
        description="A log viewer will appear here once the local node exposes a streaming endpoint. For now, gather logs directly from the local node disk."
      />

      {exportRequestedAt ? (
        <p className={styles.status}>
          <StatusBadge variant="warning">pending wiring</StatusBadge>
          <span>
            Export request recorded at{" "}
            <span className={styles.mono}>{exportRequestedAt}</span>.
            Nothing was downloaded — the log export endpoint is
            pending.
          </span>
        </p>
      ) : (
        <p className={styles.hint}>
          No export has been requested in this session.
        </p>
      )}
    </section>
  );
}
