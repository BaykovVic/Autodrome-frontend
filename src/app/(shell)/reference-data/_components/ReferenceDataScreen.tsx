"use client";

import { useState } from "react";

import { StatusBadge } from "@/components";
import {
  consoleReferenceDataFor,
} from "./consoleReferenceDataFixtures";
import type {
  ConsoleReferenceDataSnapshot,
} from "./consoleReferenceDataSnapshot";
import styles from "./ReferenceDataScreen.module.css";

type Props = {
  snapshotOverride?: ConsoleReferenceDataSnapshot;
};

export function ReferenceDataScreen({ snapshotOverride }: Props) {
  const snap =
    snapshotOverride ?? consoleReferenceDataFor("normal");
  const [selected, setSelected] = useState<string>(
    snap.selectedDictionary,
  );
  const current = snap.dictionaries.find(
    (d) => d.dictionary === selected,
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
                  aria-pressed={d.dictionary === selected}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    border:
                      d.dictionary === selected
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
                  {current.checksumShort}
                </span>{" "}
                · published at{" "}
                <span className={styles.cellMono}>
                  {current.publishedAt}
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
