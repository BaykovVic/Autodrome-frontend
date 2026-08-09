"use client";

import styles from "./NoBackendDataWidget.module.css";

/**
 * Placeholder for a dashboard block the backend read model does not
 * provide. Renders an explicit "no data" statement instead of a
 * fixture, so a live console never presents invented values as real.
 */
export function NoBackendDataWidget({
  title,
  reason = "The backend read model does not provide this block yet.",
}: {
  title: string;
  reason?: string;
}) {
  return (
    <section
      className={styles.card}
      aria-label={`${title} — no data from backend`}
    >
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.state}>No data from backend</p>
      <p className={styles.reason}>{reason}</p>
    </section>
  );
}
