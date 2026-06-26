"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_LIVE_BASE_URLS,
  SERVICE_ENV_KEYS,
  SERVICE_NAMES,
  type RuntimeDiagnostics,
  type ServiceName,
} from "@/api/runtime-config";
import { sanitizeBaseUrl } from "@/api/sanitize-base-url";
import {
  probeEndpoint,
  type ProbeResult,
} from "@/api/probe-endpoint";
import {
  Button,
  StatusBadge,
  type StatusBadgeVariant,
  Table,
} from "@/components";
import styles from "./EndpointDiagnostics.module.css";

type Props = {
  runtime: RuntimeDiagnostics;
  /**
   * Override the probe implementation in tests. Production passes
   * undefined and `probeEndpoint` uses the global `fetch`.
   */
  probe?: (url: string) => Promise<ProbeResult>;
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
  deploymentOperations: "Deployment operations",
  vehicleTelemetry: "Vehicle telemetry",
  identitySecurity: "Identity & security",
};

function configuredBaseUrl(
  runtime: RuntimeDiagnostics,
  service: ServiceName,
): string {
  if (runtime.mode === "mock") return DEFAULT_LIVE_BASE_URLS[service];
  return runtime.baseUrls[service];
}

function isConfigured(
  runtime: RuntimeDiagnostics,
  service: ServiceName,
): boolean {
  if (runtime.mode === "mock") return false;
  return runtime.baseUrls[service] !== DEFAULT_LIVE_BASE_URLS[service];
}

function probeVariant(state: ProbeResult["state"]): StatusBadgeVariant {
  switch (state) {
    case "reachable":
      return "success";
    case "degraded":
      return "warning";
    case "unreachable":
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

export function EndpointDiagnostics({ runtime, probe }: Props) {
  const probeImpl = useMemo(
    () => probe ?? ((url: string) => probeEndpoint(url)),
    [probe],
  );
  const [results, setResults] = useState<
    Partial<Record<ServiceName, ProbeResult>>
  >({});
  const [busy, setBusy] = useState<Partial<Record<ServiceName, boolean>>>(
    {},
  );

  const canProbe = runtime.mode === "live";

  async function runProbe(service: ServiceName) {
    if (!canProbe) return;
    const url = configuredBaseUrl(runtime, service);
    setBusy((prev) => ({ ...prev, [service]: true }));
    try {
      const result = await probeImpl(url);
      setResults((prev) => ({ ...prev, [service]: result }));
    } finally {
      setBusy((prev) => ({ ...prev, [service]: false }));
    }
  }

  return (
    <section
      className={styles.panel}
      aria-label="Service endpoint diagnostics"
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>Service endpoints</h3>
          <p className={styles.subtitle}>
            One row per typed frontend client. Base URLs are
            sanitized for display. Reachability checks are
            user-triggered and use an idempotent GET.
          </p>
        </div>
      </header>

      <Table caption="Frontend service endpoint diagnostics">
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Mode</th>
            <th scope="col">Configured</th>
            <th scope="col">Base URL</th>
            <th scope="col">Last check</th>
            <th scope="col" className={styles.actionsCol}>
              Reachability
            </th>
          </tr>
        </thead>
        <tbody>
          {SERVICE_NAMES.map((service) => {
            const url = configuredBaseUrl(runtime, service);
            const safeUrl = sanitizeBaseUrl(url);
            const envKey = SERVICE_ENV_KEYS[service];
            const configured = isConfigured(runtime, service);
            const result = results[service];
            const isBusy = busy[service] === true;
            return (
              <tr key={service} className={styles.row}>
                <td>
                  <div className={styles.serviceName}>
                    {SERVICE_LABELS[service]}
                  </div>
                  <div className={styles.envKey}>{envKey}</div>
                </td>
                <td>
                  <StatusBadge
                    variant={runtime.mode === "mock" ? "info" : "neutral"}
                  >
                    {runtime.mode}
                  </StatusBadge>
                </td>
                <td>
                  {runtime.mode === "mock" ? (
                    <StatusBadge variant="neutral">n/a</StatusBadge>
                  ) : configured ? (
                    <StatusBadge variant="success">configured</StatusBadge>
                  ) : (
                    <StatusBadge variant="warning">default</StatusBadge>
                  )}
                </td>
                <td className={styles.mono}>{safeUrl}</td>
                <td className={styles.mono}>
                  {result ? (
                    <>
                      <StatusBadge variant={probeVariant(result.state)}>
                        {result.state}
                        {result.httpStatus
                          ? ` · ${result.httpStatus}`
                          : ""}
                      </StatusBadge>
                      <div className={styles.checkedAt}>
                        {result.checkedAt}
                      </div>
                      {result.message ? (
                        <div className={styles.errorMessage}>
                          {result.message}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <span className={styles.hint}>not checked</span>
                  )}
                </td>
                <td className={styles.actionsCol}>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    disabled={!canProbe || isBusy}
                    title={
                      canProbe
                        ? undefined
                        : "Reachability checks are available in live mode only."
                    }
                    onClick={() => {
                      void runProbe(service);
                    }}
                  >
                    {isBusy ? "Checking…" : "Check reachability"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {runtime.mode === "mock" ? (
        <p className={styles.note}>
          Mock mode shows the default base URLs that live mode would
          use. Reachability checks are disabled — workspaces read
          fixtures instead of contacting any backend.
        </p>
      ) : null}

      {runtime.mode === "live" && !runtime.ok ? (
        <p className={styles.note}>
          One or more base URLs are misconfigured (see the issues
          list above). Reachability checks below run against the
          fallback default URL.
        </p>
      ) : null}
    </section>
  );
}
