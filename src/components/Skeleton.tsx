import type { HTMLAttributes } from "react";
import styles from "./Skeleton.module.css";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Number of placeholder lines to render. Default is 3. */
  lines?: number;
  /** Optional accessible label for the busy region. */
  label?: string;
};

export function Skeleton({
  lines = 3,
  label = "Loading",
  className,
  ...rest
}: Props) {
  const classes = [styles.skeleton, className ?? ""]
    .filter(Boolean)
    .join(" ");
  const safeLines = Math.max(1, Math.min(10, Math.floor(lines)));
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={classes}
      {...rest}
    >
      {Array.from({ length: safeLines }, (_, i) => (
        <span
          key={i}
          className={styles.line}
          style={
            // Vary widths so the placeholder looks like real text rows.
            { width: `${100 - (i * 7) % 30}%` }
          }
        />
      ))}
    </div>
  );
}
