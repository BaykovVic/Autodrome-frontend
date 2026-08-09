"use client";

import { Button, RefreshIcon } from "@/components";
import styles from "./DashboardHeader.module.css";

type Props = {
  /** `null` when the backend read model does not report node identity. */
  nodeId: string | null;
  site: string | null;
  lastRefresh: string;
  onReload: () => void;
};

/** Honest placeholder for an identity the backend did not report. */
const NOT_REPORTED = "Not reported by backend";

export function DashboardHeader({
  nodeId,
  site,
  lastRefresh,
  onReload,
}: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.titles}>
        <h1 className={styles.title}>Local Node Dashboard</h1>
        <p className={styles.subtitle}>
          <span>{nodeId ?? NOT_REPORTED}</span>
          <span aria-hidden="true"> · </span>
          <span>{site ?? NOT_REPORTED}</span>
          <span aria-hidden="true"> · </span>
          <span>last refresh </span>
          <span className={styles.mono}>{lastRefresh}</span>
        </p>
      </div>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={onReload}
        >
          <RefreshIcon />
          Refresh
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled
          title="Available once the diagnostics service is wired up on the local node."
        >
          Run diagnostics
        </Button>
      </div>
    </header>
  );
}
