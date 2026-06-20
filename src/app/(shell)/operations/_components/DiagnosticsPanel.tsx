"use client";

import { useState } from "react";

import { Button, StatusBadge } from "@/components";
import { defaultDiagnostics, type DiagnosticsInfo } from "./diagnostics";
import styles from "./DiagnosticsPanel.module.css";

type Props = {
  info?: DiagnosticsInfo;
};

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function DiagnosticsPanel({ info }: Props) {
  const data = info ?? defaultDiagnostics();
  const diskFreeGb = data.storage.diskTotalGb - data.storage.diskUsedGb;
  const [runRequestedAt, setRunRequestedAt] = useState<string | null>(
    null,
  );

  return (
    <section
      className={styles.panel}
      aria-label="Diagnostics overview"
    >
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Diagnostics</h2>
          <p className={styles.subtitle}>
            Local node identity, build, runtime and storage. Use this
            view to gather context before opening a support ticket.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled
            title="Available once the diagnostics service is wired up on the local node."
          >
            Run diagnostics check
          </Button>
        </div>
      </header>

      <dl className={styles.grid}>
        <Card label="Node id" value={data.nodeId} mono />
        <Card label="Build version" value={data.build.version} />
        <Card label="Build commit" value={data.build.commit} mono />
        <Card label="Built at" value={data.build.builtAt} mono />
        <Card label="Started at" value={data.runtime.startedAt} mono />
        <Card
          label="Uptime"
          value={formatUptime(data.runtime.uptimeSeconds)}
        />
        <Card
          label="Storage used"
          value={`${data.storage.diskUsedGb} / ${data.storage.diskTotalGb} GB`}
        />
        <Card
          label="Storage free"
          value={`${diskFreeGb} GB`}
        />
        <Card
          label="Config refreshed at"
          value={data.configRefreshedAt}
          mono
        />
      </dl>

      <section className={styles.action}>
        <h3 className={styles.actionTitle}>Recent diagnostics run</h3>
        {runRequestedAt ? (
          <p className={styles.actionStatus}>
            <StatusBadge variant="warning">pending wiring</StatusBadge>
            <span>
              Request recorded at{" "}
              <span className={styles.mono}>{runRequestedAt}</span>.
              The diagnostics action is not yet connected to the local
              node — nothing was started on this machine.
            </span>
          </p>
        ) : (
          <p className={styles.hint}>
            No diagnostics run has been requested in this session.
          </p>
        )}
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => setRunRequestedAt(new Date().toISOString())}
        >
          Record a diagnostics request (preview)
        </Button>
      </section>
    </section>
  );
}

function Card({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={styles.card}>
      <dt className={styles.cardLabel}>{label}</dt>
      <dd className={mono ? styles.cardValueMono : styles.cardValue}>
        {value}
      </dd>
    </div>
  );
}
