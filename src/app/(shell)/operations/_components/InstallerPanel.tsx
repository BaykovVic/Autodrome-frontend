"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import {
  Button,
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components";

import { installerFor } from "./installerFixtures";
import {
  liveInstallerLoader,
  liveOpsStartUpdate,
} from "./liveInstallerLoader";
import { liveOpsStartBackup } from "./liveOpsCommands";
import {
  type ConsoleInstallerOverallStatus,
  type ConsoleInstallerPrerequisiteStatus,
  type ConsoleInstallerSnapshot,
  type ConsoleUpdateJobStatus,
} from "./installerSnapshot";
import styles from "./InstallerPanel.module.css";

async function loadSnapshot(): Promise<ConsoleInstallerSnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveInstallerLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return installerFor(scenario);
}

function overallBadge(
  s: ConsoleInstallerOverallStatus,
): StatusBadgeVariant {
  switch (s) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "offline":
      return "danger";
    default:
      return "neutral";
  }
}

function prereqBadge(
  s: ConsoleInstallerPrerequisiteStatus,
): StatusBadgeVariant {
  switch (s) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "offline":
      return "danger";
    default:
      return "neutral";
  }
}

function updateBadge(s: ConsoleUpdateJobStatus): StatusBadgeVariant {
  switch (s) {
    case "completed":
      return "success";
    case "running":
    case "pending":
      return "info";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function InstallerPanel() {
  const [snapshot, setSnapshot] = useState<ConsoleInstallerSnapshot | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [backupAcknowledged, setBackupAcknowledged] = useState(false);
  const [pending, setPending] = useState<"backup" | "update" | null>(null);
  const [opError, setOpError] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const s = await loadSnapshot();
        if (!cancelled) setSnapshot(s);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Failed to load install state.",
          );
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const dispatchBackup = useCallback(async () => {
    setOpError(null);
    if (resolveRuntimeMode() !== "live") {
      setActivityLog((prev) => [
        ...prev,
        `Backup acknowledgement recorded (mock) at ${new Date().toISOString()}`,
      ]);
      setBackupAcknowledged(true);
      return;
    }
    setPending("backup");
    try {
      const job = await liveOpsStartBackup(getApiAdapter({ mode: "live" }), {
        scope: ["postgres", "config"],
      });
      setActivityLog((prev) => [
        ...prev,
        `Pre-update backup ${job.jobId} status ${job.status}`,
      ]);
      setBackupAcknowledged(true);
    } catch (e) {
      setOpError(
        e instanceof Error ? e.message : "Backup dispatch failed.",
      );
    } finally {
      setPending(null);
    }
  }, []);

  const dispatchUpdate = useCallback(async () => {
    setOpError(null);
    if (!backupAcknowledged) {
      setOpError(
        "Pre-update backup must be acknowledged before dispatching update.",
      );
      return;
    }
    if (resolveRuntimeMode() !== "live") {
      setActivityLog((prev) => [
        ...prev,
        `Update request recorded (mock) at ${new Date().toISOString()}`,
      ]);
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              lastUpdateJob: {
                jobId: "mock-update-" + Date.now().toString(36),
                packageId: "00000000-0000-4000-8000-000000000000",
                version: "0.8.0-mock",
                status: "pending",
                statusLabel: "Pending (mock)",
                startedAt: new Date().toISOString(),
              },
            }
          : prev,
      );
      return;
    }
    setPending("update");
    try {
      const job = await liveOpsStartUpdate(
        getApiAdapter({ mode: "live" }),
        {
          packageId: "00000000-0000-4000-8000-000000000000",
          version: "0.8.0",
          checksum: "operator-supplied",
        },
      );
      setSnapshot((prev) =>
        prev ? { ...prev, lastUpdateJob: job } : prev,
      );
      setActivityLog((prev) => [
        ...prev,
        `Update job ${job.jobId} status ${job.status}`,
      ]);
    } catch (e) {
      setOpError(
        e instanceof Error ? e.message : "Update dispatch failed.",
      );
    } finally {
      setPending(null);
    }
  }, [backupAcknowledged]);

  if (loadError) {
    return (
      <section className={styles.panel} aria-label="Installer overview">
        <p className={styles.degradedNote}>{loadError}</p>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className={styles.panel} aria-label="Installer overview">
        <p className={styles.notesText}>Loading install state…</p>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label="Installer overview">
      <header className={styles.header}>
        <h2 className={styles.title}>Installer &amp; update</h2>
        <p className={styles.subtitle}>
          Phase <strong>{snapshot.phaseLabel}</strong>{" "}
          <span className={styles.canonicalChip}>({snapshot.phase})</span>{" "}
          · version{" "}
          <span className={styles.cellMono}>{snapshot.version}</span> ·{" "}
          <StatusBadge variant={overallBadge(snapshot.overallStatus)}>
            {snapshot.overallStatusLabel}
          </StatusBadge>{" "}
          · checked at{" "}
          <span className={styles.cellMono}>{snapshot.checkedAt}</span>
        </p>
      </header>

      {snapshot.degradedReasons.length > 0 ? (
        <ul
          aria-label="Installer degraded reasons"
          style={{ listStyle: "disc", margin: 0, paddingLeft: 20 }}
        >
          {snapshot.degradedReasons.map((r) => (
            <li key={r} className={styles.notesText}>
              {r}
            </li>
          ))}
        </ul>
      ) : null}

      <section
        className={styles.section}
        aria-labelledby="installer-prereq-title"
      >
        <h3 id="installer-prereq-title" className={styles.sectionTitle}>
          Prerequisites ({snapshot.prerequisites.length})
        </h3>
        {snapshot.prerequisites.length === 0 ? (
          <p className={styles.notesText}>No prerequisites reported.</p>
        ) : (
          <table
            className={styles.table}
            aria-label="Installer prerequisites"
          >
            <thead>
              <tr>
                <th>Component</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.prerequisites.map((p) => (
                <tr key={p.name}>
                  <td className={styles.cellMono}>{p.name}</td>
                  <td>
                    <StatusBadge variant={prereqBadge(p.status)}>
                      {p.status}
                    </StatusBadge>
                  </td>
                  <td className={styles.notesText}>{p.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section
        className={styles.section}
        aria-labelledby="installer-actions-title"
      >
        <h3 id="installer-actions-title" className={styles.sectionTitle}>
          Update flow
        </h3>
        <p className={styles.notesText}>
          Updates are dispatched server-side. Frontend sends the canonical
          `POST /ops/update` request; nothing is executed in the browser.
        </p>
        <p
          className={styles.backupPrompt}
          role="status"
          aria-label="Backup before update prompt"
        >
          {backupAcknowledged
            ? "✓ Pre-update backup acknowledged. Update dispatch is now enabled."
            : "Run a pre-update backup before dispatching the update. Update dispatch is gated until backup is acknowledged."}
        </p>
        <div
          className={styles.actionsRow}
          role="group"
          aria-label="Installer actions"
        >
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => void dispatchBackup()}
            disabled={pending === "backup" || backupAcknowledged}
          >
            {backupAcknowledged
              ? "Backup acknowledged"
              : pending === "backup"
                ? "Running backup…"
                : "Run pre-update backup"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => void dispatchUpdate()}
            disabled={!backupAcknowledged || pending === "update"}
            title={
              !backupAcknowledged
                ? "Pre-update backup must be acknowledged first."
                : undefined
            }
          >
            {pending === "update"
              ? "Dispatching update…"
              : "Dispatch update"}
          </Button>
        </div>
        {opError ? (
          <p
            className={styles.degradedNote}
            aria-label="Installer operation error"
          >
            {opError}
          </p>
        ) : null}
      </section>

      {snapshot.lastUpdateJob ? (
        <section
          className={styles.section}
          aria-labelledby="installer-last-update-title"
        >
          <h3
            id="installer-last-update-title"
            className={styles.sectionTitle}
          >
            Last update job
          </h3>
          <p className={styles.notesText}>
            Job id{" "}
            <span className={styles.cellMono}>
              {snapshot.lastUpdateJob.jobId}
            </span>{" "}
            · target version{" "}
            <span className={styles.cellMono}>
              {snapshot.lastUpdateJob.version}
            </span>{" "}
            ·{" "}
            <StatusBadge variant={updateBadge(snapshot.lastUpdateJob.status)}>
              {snapshot.lastUpdateJob.statusLabel}
            </StatusBadge>{" "}
            <span className={styles.canonicalChip}>
              ({snapshot.lastUpdateJob.status})
            </span>{" "}
            · started at{" "}
            <span className={styles.cellMono}>
              {snapshot.lastUpdateJob.startedAt}
            </span>
          </p>
        </section>
      ) : null}

      {activityLog.length > 0 ? (
        <section
          className={styles.section}
          aria-labelledby="installer-activity-title"
        >
          <h3 id="installer-activity-title" className={styles.sectionTitle}>
            Activity log
          </h3>
          <ul
            aria-label="Installer activity log"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {activityLog.map((entry, idx) => (
              <li key={`${entry}-${idx}`} className={styles.notesText}>
                {entry}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
