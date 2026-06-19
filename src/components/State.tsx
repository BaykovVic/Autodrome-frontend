import type { ReactNode } from "react";
import styles from "./State.module.css";

export type StateTone = "empty" | "loading" | "error";

type Props = {
  tone: StateTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
}: Omit<Props, "tone">) {
  return (
    <State tone="empty" title={title} description={description} action={action} />
  );
}

export function LoadingState({
  title,
  description,
}: Omit<Props, "tone" | "action">) {
  return (
    <State
      tone="loading"
      title={title}
      description={description}
    />
  );
}

export function ErrorState({
  title,
  description,
  action,
}: Omit<Props, "tone">) {
  return (
    <State tone="error" title={title} description={description} action={action} />
  );
}

export function State({ tone, title, description, action }: Props) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "loading" ? "polite" : undefined}
      className={`${styles.state} ${styles[`tone-${tone}`]}`}
    >
      <p className={styles.title}>{title}</p>
      {description ? (
        <p className={styles.description}>{description}</p>
      ) : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
