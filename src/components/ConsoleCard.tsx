import type { HTMLAttributes, ReactNode } from "react";
import styles from "./ConsoleCard.module.css";

type Props = HTMLAttributes<HTMLElement> & {
  /**
   * Card heading shown in the top bar of the card. Pass a string
   * for the default heading style, or a ReactNode for a custom
   * header (e.g. heading + secondary metadata or actions on the
   * right).
   */
  header?: ReactNode;
  /**
   * Optional secondary node rendered on the right side of the
   * header. Ignored when `header` is a ReactNode (in that case the
   * caller controls the full header layout).
   */
  headerAside?: ReactNode;
  /**
   * Drops the inner padding so the body can render edge-to-edge —
   * useful for tables or lists that paint their own padding.
   */
  flush?: boolean;
};

export function ConsoleCard({
  header,
  headerAside,
  flush = false,
  className,
  children,
  ...rest
}: Props) {
  const headerNode =
    header !== undefined ? (
      typeof header === "string" ? (
        <header className={styles.header}>
          <span className={styles.headerTitle}>{header}</span>
          {headerAside ? (
            <span className={styles.headerAside}>{headerAside}</span>
          ) : null}
        </header>
      ) : (
        <header className={styles.header}>{header}</header>
      )
    ) : null;

  const classes = [styles.card, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} {...rest}>
      {headerNode}
      <div className={flush ? styles.bodyFlush : styles.body}>
        {children}
      </div>
    </section>
  );
}
