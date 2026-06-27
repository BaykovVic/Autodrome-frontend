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
  useConsoleCentralSync,
} from "./useConsoleCentralSync";
import type {
  ConsoleCentralSyncSnapshot,
  ConsoleLicenseStatus,
  ConsoleSyncJobStatus,
} from "./consoleCentralSyncSnapshot";
import styles from "./CentralSyncScreen.module.css";

function licenseBadge(s: ConsoleLicenseStatus): StatusBadgeVariant {
  switch (s) {
    case "valid":
      return "success";
    case "grace":
      return "warning";
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}

function jobBadge(s: ConsoleSyncJobStatus): StatusBadgeVariant {
  switch (s) {
    case "completed":
      return "success";
    case "running":
    case "pending":
      return "info";
    case "failed":
      return "danger";
    case "skipped":
    default:
      return "neutral";
  }
}

export function CentralSyncScreen() {
  const state = useConsoleCentralSync();

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="Central sync workspace"
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading central sync workspace" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="Central sync workspace"
      >
        <div className={styles.loadingPad}>
          <ApiErrorView
            error={state.fatalError}
            onRetry={state.reload}
          />
        </div>
      </section>
    );
  }

  const snap = state.snapshot;
  if (!snap) {
    return (
      <section
        className={styles.screen}
        aria-label="Central sync workspace"
      >
        <div className={styles.loadingPad}>
          <EmptyState
            title="No sync snapshot"
            description="Live and mock loaders both returned no data."
          />
        </div>
      </section>
    );
  }

  return renderSync(
    snap,
    () => void state.runSync(["read_models"]),
    () => void state.exportPackage("read_models"),
    state.pendingOperation,
  );
}

function renderSync(
  snap: ConsoleCentralSyncSnapshot,
  runSync: () => void,
  exportPackage: () => void,
  pending: "sync" | "export" | null,
) {
  return (
    <section
      className={styles.screen}
      aria-label="Central sync workspace"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>
          Central sync
          <span className={styles.optionalChip}>optional</span>
        </h1>
        <p className={styles.subtitle}>
          {snap.status.enabled ? (
            <>
              Enabled · pending items{" "}
              <strong>{snap.status.pendingItems}</strong> · last
              success at{" "}
              <span className={styles.cellMono}>
                {snap.status.lastSuccessAt}
              </span>
            </>
          ) : (
            "Disabled on this node. Local operations continue normally."
          )}
        </p>
      </header>

      {snap.degradedNote ? (
        <p
          className={styles.degradedBanner}
          role="status"
          aria-label="Central sync degraded note"
        >
          {snap.degradedNote}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="central-sync-status-title"
        >
          <h2
            id="central-sync-status-title"
            className={styles.sectionTitle}
          >
            Sync status
          </h2>
          <dl className={styles.metaGrid}>
            <dt className={styles.metaLabel}>Enabled</dt>
            <dd className={styles.metaValue}>
              {snap.status.enabled ? "yes" : "no"}
            </dd>
            <dt className={styles.metaLabel}>Pending items</dt>
            <dd className={styles.metaValue}>
              {snap.status.pendingItems}
            </dd>
            <dt className={styles.metaLabel}>Last success</dt>
            <dd className={styles.metaValue}>
              {snap.status.lastSuccessAt}
            </dd>
            {snap.status.lastError ? (
              <>
                <dt className={styles.metaLabel}>Last error</dt>
                <dd className={styles.metaValue}>
                  {snap.status.lastError}
                </dd>
              </>
            ) : null}
            <dt className={styles.metaLabel}>License</dt>
            <dd>
              <StatusBadge
                variant={licenseBadge(snap.status.licenseStatus)}
              >
                {snap.status.licenseStatusLabel}
              </StatusBadge>{" "}
              <span className={styles.canonicalChip}>
                ({snap.status.licenseStatus})
              </span>
            </dd>
            {snap.status.licenseExpiresAt ? (
              <>
                <dt className={styles.metaLabel}>License expires</dt>
                <dd className={styles.metaValue}>
                  {snap.status.licenseExpiresAt}
                </dd>
              </>
            ) : null}
            {snap.status.offlineGraceUntil ? (
              <>
                <dt className={styles.metaLabel}>Offline grace until</dt>
                <dd className={styles.metaValue}>
                  {snap.status.offlineGraceUntil}
                </dd>
              </>
            ) : null}
          </dl>
        </section>

        <section
          className={styles.section}
          aria-labelledby="central-sync-actions-title"
        >
          <h2
            id="central-sync-actions-title"
            className={styles.sectionTitle}
          >
            Sync actions
          </h2>
          <p className={styles.notesText}>
            Central sync runs through the canonical
            `POST /sync/run` and `POST /sync/packages/export`
            endpoints. Local node continues operating even when
            central is unreachable.
          </p>
          <div
            className={styles.actionsRow}
            role="group"
            aria-label="Central sync actions"
          >
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={runSync}
              disabled={
                !snap.status.enabled || pending === "sync"
              }
              title={
                !snap.status.enabled
                  ? "Central sync is disabled on this node."
                  : undefined
              }
            >
              {pending === "sync" ? "Running sync…" : "Run sync"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={exportPackage}
              disabled={pending === "export"}
            >
              {pending === "export"
                ? "Exporting…"
                : "Export read-models package"}
            </Button>
          </div>
        </section>

        {snap.lastSyncJob ? (
          <section
            className={styles.section}
            aria-labelledby="central-sync-job-title"
          >
            <h2
              id="central-sync-job-title"
              className={styles.sectionTitle}
            >
              Last sync job
            </h2>
            <p className={styles.notesText}>
              Job id{" "}
              <span className={styles.cellMono}>
                {snap.lastSyncJob.jobId}
              </span>{" "}
              ·{" "}
              <StatusBadge variant={jobBadge(snap.lastSyncJob.status)}>
                {snap.lastSyncJob.statusLabel}
              </StatusBadge>{" "}
              <span className={styles.canonicalChip}>
                ({snap.lastSyncJob.status})
              </span>{" "}
              · pending items{" "}
              <strong>{snap.lastSyncJob.pendingItems}</strong> ·
              started at{" "}
              <span className={styles.cellMono}>
                {snap.lastSyncJob.startedAt}
              </span>
            </p>
          </section>
        ) : null}

        <section
          className={styles.section}
          aria-labelledby="central-sync-packages-title"
        >
          <h2
            id="central-sync-packages-title"
            className={styles.sectionTitle}
          >
            Recent packages ({snap.recentPackages.length})
          </h2>
          {snap.recentPackages.length === 0 ? (
            <p className={styles.notesText}>
              No packages prepared on this node.
            </p>
          ) : (
            <table className={styles.table} aria-label="Recent sync packages">
              <thead>
                <tr>
                  <th>Package id</th>
                  <th>Type</th>
                  <th>Schema</th>
                  <th>Checksum</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {snap.recentPackages.map((p) => (
                  <tr key={p.packageId}>
                    <td className={styles.cellMono}>{p.packageId}</td>
                    <td>
                      {p.typeLabel}{" "}
                      <span className={styles.canonicalChip}>
                        ({p.type})
                      </span>
                    </td>
                    <td className={styles.cellMono}>v{p.schemaVersion}</td>
                    <td className={styles.cellMono}>{p.checksumShort}</td>
                    <td className={styles.cellMono}>{p.createdAt}</td>
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
