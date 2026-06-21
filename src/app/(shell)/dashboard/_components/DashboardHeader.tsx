"use client";

import { Button } from "@/components";
import styles from "./DashboardHeader.module.css";

type Props = {
  nodeId: string;
  site: string;
  lastRefresh: string;
  onReload: () => void;
};

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
          <span>{nodeId}</span>
          <span aria-hidden="true"> · </span>
          <span>{site}</span>
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
