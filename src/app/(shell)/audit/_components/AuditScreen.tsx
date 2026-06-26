"use client";

import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components";
import {
  useConsoleAudit,
  type ConsoleAuditLoader,
} from "./useConsoleAudit";
import type {
  ConsoleAuditExportFormat,
  ConsoleAuditSnapshot,
  ConsoleAuditVerificationStatus,
} from "./consoleAuditSnapshot";
import styles from "./AuditScreen.module.css";

type Props = {
  loader?: ConsoleAuditLoader;
};

function verificationBadge(
  s: ConsoleAuditVerificationStatus,
): StatusBadgeVariant {
  return s === "passed" ? "success" : "danger";
}

export function AuditScreen({ loader }: Props) {
  const state = useConsoleAudit(loader);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Audit workspace">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading audit workspace" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Audit workspace">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const snap = state.snapshot;
  if (!snap) {
    return (
      <section className={styles.screen} aria-label="Audit workspace">
        <div className={styles.loadingPad}>
          <EmptyState
            title="No audit snapshot"
            description="Live and mock loaders both returned no data."
          />
        </div>
      </section>
    );
  }

  return renderAudit(snap, state.runVerify, state.dispatchExport, state.pendingOperation);
}

function renderAudit(
  snap: ConsoleAuditSnapshot,
  runVerify: () => Promise<void>,
  dispatchExport: (f: ConsoleAuditExportFormat) => Promise<void>,
  pending: "verify" | "export" | null,
) {
  return (
    <section className={styles.screen} aria-label="Audit workspace">
      <header className={styles.header}>
        <h1 className={styles.title}>Audit &amp; integrity</h1>
        <p className={styles.subtitle}>
          {snap.totals.events} events · latest sequence{" "}
          <strong>{snap.totals.latestSequence}</strong> · hash chain
          verification + export are server-side.
        </p>
      </header>

      {snap.degradedNote ? (
        <p
          className={styles.degradedBanner}
          role="status"
          aria-label="Audit degraded note"
        >
          {snap.degradedNote}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="audit-actions-title"
        >
          <h2 id="audit-actions-title" className={styles.sectionTitle}>
            Integrity actions
          </h2>
          <p className={styles.notesText}>
            Hash chain verification runs server-side. Frontend dispatches
            the canonical command and renders the report; no client-side
            hash recomputation.
          </p>
          <div
            className={styles.actionsRow}
            role="group"
            aria-label="Audit integrity actions"
          >
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => {
                void runVerify();
              }}
              disabled={pending === "verify"}
            >
              {pending === "verify" ? "Verifying…" : "Run verification"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                void dispatchExport("jsonl");
              }}
              disabled={pending === "export"}
            >
              {pending === "export"
                ? "Exporting…"
                : "Export JSONL"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                void dispatchExport("csv");
              }}
              disabled={pending === "export"}
            >
              Export CSV
            </Button>
          </div>
        </section>

        <section
          className={styles.section}
          aria-labelledby="audit-verification-title"
        >
          <h2
            id="audit-verification-title"
            className={styles.sectionTitle}
          >
            Last verification
          </h2>
          {snap.lastVerification ? (
            <div>
              <p>
                <StatusBadge
                  variant={verificationBadge(snap.lastVerification.status)}
                >
                  {snap.lastVerification.statusLabel}
                </StatusBadge>{" "}
                <span className={styles.canonicalChip}>
                  ({snap.lastVerification.status})
                </span>
              </p>
              <p className={styles.notesText}>
                Run id{" "}
                <span className={styles.cellMono}>
                  {snap.lastVerification.runId}
                </span>{" "}
                · checked blocks{" "}
                <strong>{snap.lastVerification.checkedBlocks}</strong> ·
                ran at{" "}
                <span className={styles.cellMono}>
                  {snap.lastVerification.ranAt}
                </span>
              </p>
              {snap.lastVerification.firstError ? (
                <p
                  className={styles.verifyError}
                  aria-label="First verification error"
                >
                  First error at block{" "}
                  <span className={styles.cellMono}>
                    {snap.lastVerification.firstErrorBlockId ?? "—"}
                  </span>
                  : {snap.lastVerification.firstError}
                </p>
              ) : null}
            </div>
          ) : (
            <p className={styles.notesText}>
              No verification has run yet.
            </p>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="audit-export-title"
        >
          <h2 id="audit-export-title" className={styles.sectionTitle}>
            Last export
          </h2>
          {snap.lastExport ? (
            <p className={styles.notesText}>
              Export id{" "}
              <span className={styles.cellMono}>
                {snap.lastExport.exportId}
              </span>{" "}
              · format <strong>{snap.lastExport.formatLabel}</strong>{" "}
              <span className={styles.canonicalChip}>
                ({snap.lastExport.format})
              </span>{" "}
              · events{" "}
              <strong>{snap.lastExport.eventCount}</strong> · created at{" "}
              <span className={styles.cellMono}>
                {snap.lastExport.createdAt}
              </span>
            </p>
          ) : (
            <p className={styles.notesText}>No export has run yet.</p>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="audit-events-title"
        >
          <h2 id="audit-events-title" className={styles.sectionTitle}>
            Recent audit events ({snap.events.length})
          </h2>
          {snap.events.length === 0 ? (
            <p className={styles.notesText}>
              No audit events visible.
            </p>
          ) : (
            <table className={styles.table} aria-label="Audit event log">
              <thead>
                <tr>
                  <th>Sequence</th>
                  <th>Action</th>
                  <th>Subject</th>
                  <th>Actor</th>
                  <th>Payload hash</th>
                  <th>Occurred</th>
                </tr>
              </thead>
              <tbody>
                {snap.events.map((e) => (
                  <tr key={e.eventId}>
                    <td className={styles.cellMono}>{e.sequence}</td>
                    <td>{e.action}</td>
                    <td className={styles.cellMono}>{e.subject}</td>
                    <td className={styles.cellMono}>{e.actorId}</td>
                    <td className={styles.cellMono}>
                      {e.payloadHashShort}
                    </td>
                    <td className={styles.cellMono}>{e.occurredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </section>
  );
}
