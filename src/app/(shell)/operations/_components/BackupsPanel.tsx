"use client";

import { useState } from "react";

import {
  Button,
  StatusBadge,
  type StatusBadgeVariant,
  Table,
} from "@/components";
import { ConfirmDestructiveDialog } from "./ConfirmDestructiveDialog";
import {
  defaultBackups,
  type BackupSnapshot,
  type BackupStatus,
} from "./backups";
import styles from "./BackupsPanel.module.css";

type Props = {
  snapshots?: BackupSnapshot[];
};

type ConfirmTarget =
  | { kind: "create" }
  | { kind: "restore"; snapshot: BackupSnapshot };

type ActivityEntry = {
  id: string;
  at: string;
  label: string;
};

function statusVariant(status: BackupStatus): StatusBadgeVariant {
  switch (status) {
    case "completed":
      return "success";
    case "running":
      return "info";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function BackupsPanel({ snapshots }: Props) {
  const data = snapshots ?? defaultBackups();

  const [confirm, setConfirm] = useState<ConfirmTarget | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  function recordActivity(label: string) {
    setActivity((prev) => [
      {
        id: `${prev.length + 1}`,
        at: new Date().toISOString(),
        label,
      },
      ...prev,
    ]);
  }

  function onConfirm() {
    if (!confirm) return;
    if (confirm.kind === "create") {
      recordActivity("Create backup request recorded");
    } else {
      recordActivity(
        `Restore from ${confirm.snapshot.id} request recorded`,
      );
    }
    setConfirm(null);
  }

  return (
    <section className={styles.panel} aria-label="Backups overview">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Backups</h2>
          <p className={styles.subtitle}>
            Recent backup snapshots on this local node. Create and
            restore are preview-only until the backup engine
            integration lands.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => setConfirm({ kind: "create" })}
          >
            Create backup (preview)
          </Button>
        </div>
      </header>

      <Table caption="Recent backup snapshots">
        <thead>
          <tr>
            <th scope="col">Snapshot</th>
            <th scope="col">Kind</th>
            <th scope="col">Status</th>
            <th scope="col">Size</th>
            <th scope="col">Created</th>
            <th scope="col" className={styles.actionsCol}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((snapshot) => (
            <tr key={snapshot.id}>
              <td>
                <div className={styles.snapshotName}>{snapshot.id}</div>
                {snapshot.description ? (
                  <div className={styles.snapshotHint}>
                    {snapshot.description}
                  </div>
                ) : null}
              </td>
              <td>{snapshot.kind}</td>
              <td>
                <StatusBadge variant={statusVariant(snapshot.status)}>
                  {snapshot.status}
                </StatusBadge>
              </td>
              <td className={styles.mono}>{snapshot.sizeMb} MB</td>
              <td className={styles.mono}>{snapshot.createdAt}</td>
              <td className={styles.actionsCol}>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled={snapshot.status !== "completed"}
                  onClick={() =>
                    setConfirm({ kind: "restore", snapshot })
                  }
                  title={
                    snapshot.status === "completed"
                      ? undefined
                      : "Only completed snapshots can be restored."
                  }
                >
                  Restore (preview)
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <section className={styles.activity}>
        <h3 className={styles.activityTitle}>Activity log</h3>
        {activity.length === 0 ? (
          <p className={styles.hint}>
            No backup or restore requests have been recorded in this
            session.
          </p>
        ) : (
          <ul className={styles.activityList}>
            {activity.map((entry) => (
              <li key={entry.id} className={styles.activityRow}>
                <StatusBadge variant="warning">pending wiring</StatusBadge>
                <span>
                  {entry.label} at{" "}
                  <span className={styles.mono}>{entry.at}</span>.
                  Nothing was changed on this node — the backup engine
                  integration is pending.
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDestructiveDialog
        open={!!confirm}
        title={
          confirm?.kind === "restore"
            ? "Restore from snapshot?"
            : "Create a new backup?"
        }
        description={
          confirm?.kind === "restore" ? (
            <span>
              This action would replace local node data with snapshot{" "}
              <span className={styles.mono}>
                {confirm.snapshot.id}
              </span>{" "}
              created at{" "}
              <span className={styles.mono}>
                {confirm.snapshot.createdAt}
              </span>
              .
            </span>
          ) : (
            <span>
              This action would start a new backup of the local node
              state.
            </span>
          )
        }
        warning={
          confirm?.kind === "restore"
            ? "Restore is destructive and will overwrite local data. The backup engine is not connected yet, so nothing will be changed on this node."
            : "The backup engine is not connected yet, so nothing will be started on this node."
        }
        confirmLabel={
          confirm?.kind === "restore"
            ? "Record restore request"
            : "Record backup request"
        }
        onCancel={() => setConfirm(null)}
        onConfirm={onConfirm}
      />
    </section>
  );
}
