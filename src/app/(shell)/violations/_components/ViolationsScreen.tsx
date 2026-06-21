"use client";

import { useMemo, useState } from "react";

import {
  ApiErrorView,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  useConsoleViolations,
  type ConsoleViolationsLoader,
} from "./useConsoleViolations";
import type {
  ConsoleViolation,
  ConsoleViolationEvidenceKind,
  ConsoleViolationSeverity,
  ConsoleViolationStatus,
} from "./consoleViolationsSnapshot";
import styles from "./ViolationsScreen.module.css";

type Props = {
  loader?: ConsoleViolationsLoader;
};

function severityDot(severity: ConsoleViolationSeverity): StatusDotVariant {
  switch (severity) {
    case "critical":
      return "offline";
    case "major":
      return "degraded";
    case "minor":
    default:
      return "unknown";
  }
}

function severityBadge(
  severity: ConsoleViolationSeverity,
): StatusBadgeVariant {
  switch (severity) {
    case "critical":
      return "danger";
    case "major":
      return "warning";
    case "minor":
    default:
      return "neutral";
  }
}

function statusDot(status: ConsoleViolationStatus): StatusDotVariant {
  switch (status) {
    case "active":
      return "online";
    case "deprecated":
    default:
      return "offline";
  }
}

function statusBadge(status: ConsoleViolationStatus): StatusBadgeVariant {
  switch (status) {
    case "active":
      return "success";
    case "deprecated":
    default:
      return "neutral";
  }
}

function evidenceClass(kind: ConsoleViolationEvidenceKind): string {
  switch (kind) {
    case "telemetry":
      return styles.evidenceDotTelemetry;
    case "video":
      return styles.evidenceDotVideo;
    case "photo":
      return styles.evidenceDotPhoto;
    case "audio":
    default:
      return styles.evidenceDotAudio;
  }
}

function evidenceLabel(kind: ConsoleViolationEvidenceKind): string {
  switch (kind) {
    case "telemetry":
      return "Telemetry";
    case "video":
      return "Video";
    case "photo":
      return "Photo";
    case "audio":
    default:
      return "Audio";
  }
}

export function ViolationsScreen({ loader }: Props) {
  const state = useConsoleViolations(loader);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const violations = useMemo(
    () => state.snapshot?.violations ?? [],
    [state.snapshot],
  );

  const selected: ConsoleViolation | undefined = useMemo(() => {
    if (selectedId) {
      const match = violations.find((v) => v.id === selectedId);
      if (match) return match;
    }
    return violations[0];
  }, [violations, selectedId]);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Violations">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading violations" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Violations">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const activeRule = state.snapshot?.activeRule;

  return (
    <section className={styles.screen} aria-label="Violations">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Violations catalog</h1>
          <p className={styles.subtitle}>
            Active rule version{" "}
            <span className={styles.activeRule}>
              {activeRule ? `${activeRule.id} · ${activeRule.version}` : "—"}
            </span>
          </p>
        </div>
        <div className={styles.legend} aria-label="Severity legend">
          <span className={styles.legendItem}>
            <span
              className={`${styles.legendSwatch} ${styles.legendCritical}`}
              aria-hidden="true"
            />
            Critical
          </span>
          <span className={styles.legendItem}>
            <span
              className={`${styles.legendSwatch} ${styles.legendMajor}`}
              aria-hidden="true"
            />
            Major
          </span>
          <span className={styles.legendItem}>
            <span
              className={`${styles.legendSwatch} ${styles.legendMinor}`}
              aria-hidden="true"
            />
            Minor
          </span>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.tableColumn}>
          {violations.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                title="No violations"
                description="No violations in this scenario."
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>Code</th>
                  <th scope="col" className={styles.th}>Violation</th>
                  <th scope="col" className={styles.th}>Severity</th>
                  <th
                    scope="col"
                    className={`${styles.th} ${styles.thRight}`}
                  >
                    Penalty
                  </th>
                  <th scope="col" className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => {
                  const isSelected = v.id === selected?.id;
                  return (
                    <tr
                      key={v.id}
                      className={
                        isSelected
                          ? `${styles.row} ${styles.rowActive}`
                          : styles.row
                      }
                      aria-selected={isSelected}
                    >
                      <td className={styles.td}>
                        <button
                          type="button"
                          className={styles.codeBtn}
                          onClick={() => setSelectedId(v.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          {v.code}
                        </button>
                      </td>
                      <td className={styles.td}>{v.name}</td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot
                            variant={severityDot(v.severity)}
                            halo={false}
                          />
                          <StatusBadge variant={severityBadge(v.severity)}>
                            {v.severityLabel}
                          </StatusBadge>
                        </span>
                      </td>
                      <td
                        className={`${styles.td} ${styles.tdRight} ${styles.mono}`}
                      >
                        {v.penalty}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot
                            variant={statusDot(v.status)}
                            halo={false}
                          />
                          <StatusBadge variant={statusBadge(v.status)}>
                            {v.statusLabel}
                          </StatusBadge>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected ? (
          <aside
            className={styles.detail}
            aria-label={`Violation ${selected.code}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailCode}>{selected.code}</div>
              <div className={styles.detailName}>{selected.name}</div>
              <div className={styles.detailBadgeRow}>
                <span className={styles.statusCell}>
                  <StatusDot
                    variant={severityDot(selected.severity)}
                    halo={false}
                  />
                  <StatusBadge variant={severityBadge(selected.severity)}>
                    {selected.severityLabel}
                  </StatusBadge>
                </span>
                <span className={styles.statusCell}>
                  <StatusDot
                    variant={statusDot(selected.status)}
                    halo={false}
                  />
                  <StatusBadge variant={statusBadge(selected.status)}>
                    {selected.statusLabel}
                  </StatusBadge>
                </span>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Scoring</div>
              <dl className={styles.paramList}>
                <ParamRow label="Penalty" value={selected.penalty} mono />
                <ParamRow label="Active rule" value={selected.ruleId} mono />
              </dl>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Required evidence</div>
              {selected.requiredEvidence.length === 0 ? (
                <p className={styles.paramLabel}>No evidence configured.</p>
              ) : (
                <div className={styles.evidenceChips}>
                  {selected.requiredEvidence.map((kind) => (
                    <span key={kind} className={styles.evidenceChip}>
                      <span
                        className={`${styles.evidenceChipDot} ${evidenceClass(kind)}`}
                        aria-hidden="true"
                      />
                      {evidenceLabel(kind)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function ParamRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={styles.paramRow}>
      <dt className={styles.paramLabel}>{label}</dt>
      <dd className={mono ? styles.paramValueMono : styles.paramValue}>
        {value}
      </dd>
    </div>
  );
}
