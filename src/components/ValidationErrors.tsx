import type { ReactNode } from "react";
import styles from "./ValidationErrors.module.css";

export type ValidationIssue = {
  /** Path or field name, e.g. "candidateId" or "identityDocument.documentNumber". */
  field: string;
  message: ReactNode;
};

type Props = {
  title?: ReactNode;
  issues: ValidationIssue[];
};

export function ValidationErrors({
  title = "Please fix the following:",
  issues,
}: Props) {
  if (!issues.length) return null;
  return (
    <section
      role="alert"
      aria-live="polite"
      className={styles.panel}
    >
      <p className={styles.title}>{title}</p>
      <ul className={styles.list}>
        {issues.map((issue, index) => (
          <li
            key={`${issue.field}-${index}`}
            className={styles.item}
          >
            <span className={styles.field}>{issue.field}</span>
            <span className={styles.message}>{issue.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
