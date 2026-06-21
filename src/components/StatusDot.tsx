import type { HTMLAttributes } from "react";
import styles from "./StatusDot.module.css";

export type StatusDotVariant =
  | "online"
  | "degraded"
  | "offline"
  | "standby"
  | "unknown";

type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  variant?: StatusDotVariant;
  /**
   * Optional accessible label. The dot has no rendered text, so a
   * label is required when the dot stands on its own; when the dot
   * is read together with a sibling text node, callers can leave
   * this undefined.
   */
  label?: string;
  /**
   * When true, draws a soft halo around the dot (matches the
   * Autodrome Console topbar status indicator). Defaults to true.
   */
  halo?: boolean;
};

export function StatusDot({
  variant = "unknown",
  label,
  halo = true,
  className,
  ...rest
}: Props) {
  const classes = [
    styles.dot,
    styles[`variant-${variant}`],
    halo ? styles.halo : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={classes}
      {...rest}
    />
  );
}
