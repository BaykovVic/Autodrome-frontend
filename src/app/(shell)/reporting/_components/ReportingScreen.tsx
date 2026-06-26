"use client";

import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  useConsoleReporting,
  type ConsoleReportingLoader,
} from "./useConsoleReporting";
import type {
  ConsoleReportStatus,
  ConsoleReportingReport,
  ConsoleReportingSnapshot,
  ConsoleReportingTemplate,
} from "./consoleReportingSnapshot";
import styles from "./ReportingScreen.module.css";

type Props = {
  loader?: ConsoleReportingLoader;
};

function statusBadge(s: ConsoleReportStatus): StatusBadgeVariant {
  switch (s) {
    case "ready":
      return "success";
    case "accepted":
    case "inProgress":
      return "info";
    case "failed":
      return "danger";
    case "unknown":
    default:
      return "neutral";
  }
}

function statusDot(s: ConsoleReportStatus): StatusDotVariant {
  switch (s) {
    case "ready":
      return "online";
    case "accepted":
    case "inProgress":
      return "standby";
    case "failed":
      return "offline";
    case "unknown":
    default:
      return "offline";
  }
}

export function ReportingScreen({ loader }: Props) {
  const state = useConsoleReporting(loader);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Reporting workspace">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading reporting workspace" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Reporting workspace">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const snap = state.snapshot;
  if (!snap) {
    return (
      <section className={styles.screen} aria-label="Reporting workspace">
        <div className={styles.loadingPad}>
          <EmptyState
            title="No reporting snapshot"
            description="Live and mock loaders both returned no data."
          />
        </div>
      </section>
    );
  }

  return renderReporting(snap);
}

function renderReporting(snap: ConsoleReportingSnapshot) {
  return (
    <section className={styles.screen} aria-label="Reporting workspace">
      <header className={styles.header}>
        <h1 className={styles.title}>Reporting</h1>
        <p className={styles.subtitle}>
          {snap.totals.templates} templates ·{" "}
          {snap.totals.publishedTemplates} published ·{" "}
          {snap.totals.reports} recent reports ·{" "}
          {snap.totals.readyReports} ready ·{" "}
          {snap.totals.failedReports} failed
        </p>
      </header>

      <p className={styles.unavailableBanner} role="status">
        Rendering and export are intentionally disabled in this view —
        they ship with the dedicated playback and export features.
      </p>

      {snap.degradedNote ? (
        <p className={styles.degradedBanner} aria-label="Reporting degraded note">
          {snap.degradedNote}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="reporting-templates-title"
        >
          <h2
            id="reporting-templates-title"
            className={styles.sectionTitle}
          >
            Template catalog ({snap.templates.length})
          </h2>
          {snap.templates.length === 0 ? (
            <p className={styles.notesText}>
              No templates published yet.
            </p>
          ) : (
            <table
              className={styles.table}
              aria-label="Reporting template catalog"
            >
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Type</th>
                  <th>Version</th>
                  <th>Published</th>
                </tr>
              </thead>
              <tbody>
                {snap.templates.map((t: ConsoleReportingTemplate) => (
                  <tr key={t.templateId}>
                    <td>
                      <span className={styles.cellMono}>
                        {t.templateId}
                      </span>{" "}
                      · {t.name}
                    </td>
                    <td>
                      {t.reportTypeLabel}{" "}
                      <span className={styles.canonicalChip}>
                        ({t.reportType})
                      </span>
                    </td>
                    <td className={styles.cellMono}>v{t.version}</td>
                    <td className={styles.cellMono}>{t.publishedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="reporting-reports-title"
        >
          <h2
            id="reporting-reports-title"
            className={styles.sectionTitle}
          >
            Recent reports ({snap.reports.length})
          </h2>
          {snap.reports.length === 0 ? (
            <p className={styles.notesText}>
              No recent reports.
            </p>
          ) : (
            <table className={styles.table} aria-label="Recent reports">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Exam</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Generated</th>
                </tr>
              </thead>
              <tbody>
                {snap.reports.map((r: ConsoleReportingReport) => (
                  <tr key={r.reportId}>
                    <td>
                      <span className={styles.cellMono}>{r.reportId}</span>
                      {r.fetchError ? (
                        <p
                          className={styles.rowError}
                          aria-label={`Fetch error for ${r.reportId}`}
                        >
                          {r.fetchError}
                        </p>
                      ) : null}
                    </td>
                    <td>
                      {r.reportTypeLabel}{" "}
                      <span className={styles.canonicalChip}>
                        ({r.reportType})
                      </span>
                    </td>
                    <td>
                      {r.formatLabel}{" "}
                      <span className={styles.canonicalChip}>
                        ({r.format})
                      </span>
                    </td>
                    <td className={styles.cellMono}>{r.examId}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <StatusDot
                          variant={statusDot(r.status)}
                          halo={false}
                        />
                        <StatusBadge variant={statusBadge(r.status)}>
                          {r.statusLabel}
                        </StatusBadge>
                      </span>
                    </td>
                    <td className={styles.cellMono}>{r.requestedAt}</td>
                    <td className={styles.cellMono}>{r.generatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="reporting-actions-title"
        >
          <h2
            id="reporting-actions-title"
            className={styles.sectionTitle}
          >
            Generate report
          </h2>
          <p className={styles.notesText}>
            Generate report request flow lands once the
            reporting-document-service write path is wired with
            idempotency keys. Currently the catalog read is
            live; submission is intentionally disabled.
          </p>
          <div role="group" aria-label="Reporting actions">
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled
              title="Request submission is not yet wired — see the dedicated reporting workflow feature."
            >
              Generate report (unavailable)
            </Button>{" "}
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled
              title="Report export lands with the dedicated reporting export feature."
            >
              Export (unavailable)
            </Button>
          </div>
        </section>
      </div>
    </section>
  );
}
