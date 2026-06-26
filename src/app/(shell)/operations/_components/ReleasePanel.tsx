"use client";

import { StatusBadge } from "@/components";
import styles from "./ReleasePanel.module.css";

/**
 * Release artifact hand-off panel.
 *
 * Surfaces frontend build/version metadata, статичный
 * checklist link (`RELEASE_CANDIDATE_CHECKLIST.md` в repo
 * root) и deploy hand-off status. Per spec rule "No
 * signing/packaging implementation in frontend" — этот
 * surface read-only, никакого signing / packaging.
 *
 * Deploy API не существует в canonical contracts; status
 * collapses к "Static checklist · no canonical deploy
 * API". Operator видит deploy-checklist artifact path в
 * repo root; release engineer проходит checklist вручную.
 */

const BUILD_METADATA = {
  frameworkLabel: "Next.js",
  frameworkVersion: "16.2.9",
  reactVersion: "19.2.4",
  runtimeMode: "mock (deterministic)" as const,
  /**
   * Build timestamp populated at build time через env. Без
   * env остаётся placeholder.
   */
  buildTimestamp:
    process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? "—",
};

const CHECKLIST_HIGHLIGHTS = [
  "Build & test gates: pnpm release-gate + pnpm e2e.",
  "Runtime mode matrix: mock / mock+scenario / live / live+per-service.",
  "9 registered backend services (canonical OpenAPI).",
  "Known degraded states (4 BLOCKED backend contracts).",
  "Rollback notes: git revert -m 1 / no master push без approval.",
  "Sign-off: release-gate, iCloud sweep, mode confirmation, blocker review, rollback plan.",
];

type HandoffEntry = {
  label: string;
  status: "static" | "degraded";
  detail: string;
};

const HANDOFF_ENTRIES: HandoffEntry[] = [
  {
    label: "Frontend release checklist artifact",
    status: "static",
    detail: "RELEASE_CANDIDATE_CHECKLIST.md (repo root)",
  },
  {
    label: "Deploy hand-off API",
    status: "degraded",
    detail:
      "No canonical deploy-operations contract. Pass artifact manually to release engineer.",
  },
  {
    label: "Build artifact",
    status: "static",
    detail: ".next/ + package.json + pnpm-lock.yaml",
  },
];

function statusBadgeFor(s: HandoffEntry["status"]) {
  return s === "static" ? "info" : "warning";
}

function statusLabel(s: HandoffEntry["status"]) {
  return s === "static" ? "Static" : "Degraded";
}

export function ReleasePanel() {
  return (
    <section
      className={styles.panel}
      aria-label="Release artifact hand-off"
    >
      <header className={styles.header}>
        <h2 className={styles.title}>Release artifact hand-off</h2>
        <p className={styles.subtitle}>
          Read-only surface. Никакого signing / packaging в
          frontend — release engineer проходит checklist
          вручную.
        </p>
      </header>

      <section
        className={styles.section}
        aria-labelledby="release-panel-build-title"
      >
        <h3 id="release-panel-build-title" className={styles.sectionTitle}>
          Build metadata
        </h3>
        <dl className={styles.metaGrid}>
          <dt className={styles.metaLabel}>Framework</dt>
          <dd className={styles.metaValue}>
            {BUILD_METADATA.frameworkLabel} v
            {BUILD_METADATA.frameworkVersion}{" "}
            <span className={styles.canonicalChip}>
              ({BUILD_METADATA.runtimeMode})
            </span>
          </dd>
          <dt className={styles.metaLabel}>React</dt>
          <dd className={styles.metaValue}>
            v{BUILD_METADATA.reactVersion}
          </dd>
          <dt className={styles.metaLabel}>Build timestamp</dt>
          <dd className={styles.metaValue}>
            {BUILD_METADATA.buildTimestamp}
          </dd>
        </dl>
        <p className={styles.degradedNote} role="status">
          Build timestamp populated через
          `NEXT_PUBLIC_BUILD_TIMESTAMP` env var (CI job sets
          its). Placeholder (&ldquo;—&rdquo;) если не выставлено.
        </p>
      </section>

      <section
        className={styles.section}
        aria-labelledby="release-panel-checklist-title"
      >
        <h3
          id="release-panel-checklist-title"
          className={styles.sectionTitle}
        >
          Release candidate checklist
        </h3>
        <p className={styles.metaLabel}>
          Artifact path: <code>RELEASE_CANDIDATE_CHECKLIST.md</code>
        </p>
        <ul
          className={styles.checklistList}
          aria-label="Release checklist highlights"
        >
          {CHECKLIST_HIGHLIGHTS.map((line) => (
            <li key={line} className={styles.checklistItem}>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section
        className={styles.section}
        aria-labelledby="release-panel-handoff-title"
      >
        <h3
          id="release-panel-handoff-title"
          className={styles.sectionTitle}
        >
          Hand-off status
        </h3>
        <ul
          aria-label="Release hand-off entries"
          style={{ listStyle: "none", margin: 0, padding: 0 }}
        >
          {HANDOFF_ENTRIES.map((entry) => (
            <li key={entry.label} className={styles.handoffRow}>
              <span className={styles.handoffLabel}>{entry.label}</span>
              <span className={styles.handoffStatus}>{entry.detail}</span>
              <StatusBadge variant={statusBadgeFor(entry.status)}>
                {statusLabel(entry.status)}
              </StatusBadge>
            </li>
          ))}
        </ul>
        <p className={styles.degradedNote} role="status">
          Deploy hand-off API отсутствует в canonical
          contracts (deployment-operations-service не
          существует — см. blocked reports T5-F1/F2/F3).
          Surface остаётся static до его появления.
        </p>
      </section>
    </section>
  );
}
