import type { HTMLAttributes, ReactNode } from "react";
import styles from "./SummaryCard.module.css";

type Props = HTMLAttributes<HTMLElement> & {
  title: ReactNode;
  hint?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export function SummaryCard({
  title,
  hint,
  footer,
  className,
  children,
  ...rest
}: Props) {
  const classes = [styles.card, className ?? ""].filter(Boolean).join(" ");
  return (
    <section className={classes} {...rest}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </header>
      {children ? <div className={styles.body}>{children}</div> : null}
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </section>
  );
}
