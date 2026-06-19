import type { HTMLAttributes, ReactNode } from "react";
import styles from "./StatusBadge.module.css";

export type StatusBadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusBadgeVariant;
  children: ReactNode;
};

export function StatusBadge({
  variant = "neutral",
  className,
  children,
  ...rest
}: Props) {
  const classes = [
    styles.badge,
    styles[`variant-${variant}`],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
