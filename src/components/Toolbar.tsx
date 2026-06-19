import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Toolbar.module.css";

type Props = HTMLAttributes<HTMLDivElement> & {
  ariaLabel: string;
  children: ReactNode;
};

export function Toolbar({ ariaLabel, className, children, ...rest }: Props) {
  const classes = [styles.toolbar, className ?? ""].filter(Boolean).join(" ");
  return (
    <div role="toolbar" aria-label={ariaLabel} className={classes} {...rest}>
      {children}
    </div>
  );
}

type SectionProps = HTMLAttributes<HTMLDivElement>;

export function ToolbarSection({
  className,
  children,
  ...rest
}: SectionProps) {
  const classes = [styles.section, className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
