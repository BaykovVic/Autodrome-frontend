import type { ReactNode } from "react";
import { Button } from "./Button";
import styles from "./DegradedState.module.css";

type Props = {
  /** Short service or surface name, e.g. "vehicle-service". */
  service: string;
  /** Human-readable explanation. */
  description?: ReactNode;
  /** Optional retry callback for read-only operations. */
  onRetry?: () => void;
  retryLabel?: string;
};

export function DegradedState({
  service,
  description,
  onRetry,
  retryLabel = "Try again",
}: Props) {
  return (
    <section
      role="alert"
      aria-live="polite"
      className={styles.panel}
    >
      <header className={styles.header}>
        <span className={styles.tag}>degraded</span>
        <span className={styles.service}>{service}</span>
      </header>
      {description ? (
        <p className={styles.description}>{description}</p>
      ) : (
        <p className={styles.description}>
          The service is temporarily unavailable. Latest data may be stale.
        </p>
      )}
      {onRetry ? (
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
