"use client";

import { useMemo, useState } from "react";

import { getRuntimeDiagnostics } from "@/api/get-api-adapter";
import {
  SERVICE_ENV_KEYS,
  type RuntimeDiagnostics,
  type ServiceName,
} from "@/api/runtime-config";
import { sanitizeBaseUrl } from "@/api/sanitize-base-url";
import { Button, StatusBadge, type StatusBadgeVariant } from "@/components";
import { defaultDiagnostics, type DiagnosticsInfo } from "./diagnostics";
import { EndpointDiagnostics } from "./EndpointDiagnostics";
import styles from "./DiagnosticsPanel.module.css";

type Props = {
  info?: DiagnosticsInfo;
  runtime?: RuntimeDiagnostics;
};

const SERVICE_LABELS: Record<ServiceName, string> = {
  candidate: "Candidate",
  vehicle: "Vehicle",
  exam: "Exam",
  exercise: "Exercise",
  violationRule: "Violation & rule",
  mediaArchive: "Media archive",
  androidDevice: "Android device management",
  virtualVehicle: "Virtual vehicle",
  reportingDocument: "Reporting document",
};

function modeVariant(
  runtime: RuntimeDiagnostics,
): StatusBadgeVariant {
  if (runtime.mode === "mock") return "info";
  if (runtime.ok) return "success";
  return "warning";
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function DiagnosticsPanel({ info, runtime }: Props) {
  const data = info ?? defaultDiagnostics();
  const diskFreeGb = data.storage.diskTotalGb - data.storage.diskUsedGb;
  const runtimeData = useMemo(
    () => runtime ?? getRuntimeDiagnostics(),
    [runtime],
  );
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

      <section
        className={styles.runtime}
        aria-label="Runtime API mode"
      >
        <h3 className={styles.actionTitle}>Runtime API mode</h3>
        <p className={styles.runtimeRow}>
          <StatusBadge variant={modeVariant(runtimeData)}>
            {runtimeData.mode}
          </StatusBadge>
          {runtimeData.mode === "mock" ? (
            <span>
              Workspaces read fixtures from scenario{" "}
              <span className={styles.mono}>
                {runtimeData.scenario}
              </span>
              . No real backend is contacted.
            </span>
          ) : runtimeData.ok ? (
            <span>
              Workspaces talk to the configured live services.
            </span>
          ) : (
            <span>
              Live mode is degraded: some service base URLs are
              invalid and fall back to defaults.
            </span>
          )}
        </p>

        {runtimeData.mode === "live" ? (
          <dl className={styles.runtimeList}>
            {(Object.entries(runtimeData.baseUrls) as Array<
              [ServiceName, string]
            >).map(([service, url]) => (
              <div key={service} className={styles.runtimeListRow}>
                <dt className={styles.runtimeListLabel}>
                  {SERVICE_LABELS[service]}
                </dt>
                <dd className={styles.runtimeListValue}>
                  {sanitizeBaseUrl(url)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {runtimeData.mode === "live" && !runtimeData.ok ? (
          <ul className={styles.runtimeIssues}>
            {runtimeData.issues.map((issue) => (
              <li key={issue.field} className={styles.runtimeIssue}>
                <span className={styles.mono}>{issue.field}</span>:{" "}
                {issue.message}
              </li>
            ))}
            <li className={styles.runtimeIssueHint}>
              Fix the values for{" "}
              {runtimeData.issues
                .map((i) => i.field)
                .join(", ")}{" "}
              and reload to pick them up. See{" "}
              <span className={styles.mono}>
                {SERVICE_ENV_KEYS.candidate.replace(
                  "CANDIDATE",
                  "<SERVICE>",
                )}
              </span>{" "}
              naming.
            </li>
          </ul>
        ) : null}
      </section>

      <EndpointDiagnostics runtime={runtimeData} />

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
