"use client";

import { useMemo, useState } from "react";

import { ApiErrorView, EmptyState, Skeleton, StatusBadge } from "@/components";
import type {
  ConsoleReferenceDataSnapshot,
} from "./consoleReferenceDataSnapshot";
import {
  useConsoleReferenceData,
  type ConsoleReferenceDataLoader,
} from "./useConsoleReferenceData";
import styles from "./ReferenceDataScreen.module.css";

type Props = {
  snapshotOverride?: ConsoleReferenceDataSnapshot;
  /** Injected loader (tests). Live mode reads reference-data-service. */
  loader?: ConsoleReferenceDataLoader;
};

export function ReferenceDataScreen({ snapshotOverride, loader }: Props) {
  // Memoised: a fresh loader identity on every render would retrigger
  // the hook effect in a loop.
  const effectiveLoader = useMemo(
    () => (snapshotOverride ? () => snapshotOverride : loader),
    [snapshotOverride, loader],
  );
  const state = useConsoleReferenceData(effectiveLoader);
  const snap = state.snapshot;
  // Null until the operator picks one: the active dictionary then
  // derives from the snapshot, so no effect is needed to sync it.
  const [selected, setSelected] = useState<string | null>(null);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Reference data workspace">
        <Skeleton lines={6} label="Loading reference data" />
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Reference data workspace">
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      </section>
    );
  }

  if (!snap) {
    return (
      <section className={styles.screen} aria-label="Reference data workspace">
        <EmptyState
          title="No reference data"
          description="Live and mock loaders both returned no data."
        />
      </section>
    );
  }
  const activeKey = selected ?? snap.selectedDictionary;
  const current = snap.dictionaries.find(
    (d) => d.dictionary === activeKey,
  );

  return (
    <section
      className={styles.screen}
      aria-label="Reference data workspace"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>Reference data</h1>
        <p className={styles.subtitle}>
          {snap.dictionaries.length} dictionaries · canonical
          `reference-data-service` view-model.
        </p>
      </header>

      {snap.degradedNote ? (
        <p
          role="status"
          aria-label="Reference data degraded note"
          style={{
            margin: "12px 20px 0",
            padding: "10px 12px",
            border: "var(--border-width) solid var(--color-border-strong)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface-soft)",
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {snap.degradedNote}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="reference-data-nav-title"
        >
          <h2
            id="reference-data-nav-title"
            className={styles.sectionTitle}
          >
            Dictionaries ({snap.dictionaries.length})
          </h2>
          {snap.dictionaries.length === 0 ? (
            <p className={styles.notesText}>
              No dictionaries returned.
            </p>
          ) : (
            <div
              className={styles.dictionaryNav}
              role="group"
              aria-label="Dictionary picker"
            >
              {snap.dictionaries.map((d) => (
                <button
                  key={d.dictionary}
                  type="button"
                  onClick={() => setSelected(d.dictionary)}
                  aria-pressed={d.dictionary === activeKey}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    border:
                      d.dictionary === activeKey
                        ? "2px solid var(--color-text)"
                        : "var(--border-width) solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    fontSize: "var(--font-size-sm)",
                    cursor: "pointer",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {current ? (
          <>
            <section
              className={styles.section}
              aria-labelledby="reference-data-meta-title"
            >
              <h2
                id="reference-data-meta-title"
                className={styles.sectionTitle}
              >
                {current.label} version
              </h2>
              <p className={styles.notesText}>
                Canonical name{" "}
                <span className={styles.cellMono}>
                  {current.dictionary}
                </span>{" "}
                · version{" "}
                <StatusBadge variant="info">
                  v{current.version}
                </StatusBadge>{" "}
                · checksum{" "}
                <span className={styles.cellMono}>
                  {current.checksumShort ?? "—"}
                </span>{" "}
                · published at{" "}
                <span className={styles.cellMono}>
                  {current.publishedAt ?? "—"}
                </span>
              </p>
            </section>

            <section
              className={styles.section}
              aria-labelledby="reference-data-items-title"
            >
              <h2
                id="reference-data-items-title"
                className={styles.sectionTitle}
              >
                Items ({current.items.length})
              </h2>
              {current.items.length === 0 ? (
                <p className={styles.notesText}>
                  No items in this dictionary.
                </p>
              ) : (
                <table
                  className={styles.table}
                  aria-label="Reference dictionary items"
                >
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Title</th>
                      <th>Valid from</th>
                      <th>Valid to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.items.map((it) => (
                      <tr key={it.itemId}>
                        <td className={styles.cellMono}>{it.code}</td>
                        <td>{it.title}</td>
                        <td className={styles.cellMono}>
                          {it.validFrom ?? "—"}
                        </td>
                        <td className={styles.cellMono}>
                          {it.validTo ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}
