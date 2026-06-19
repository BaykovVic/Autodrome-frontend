import type { ReactNode, TableHTMLAttributes } from "react";
import styles from "./Table.module.css";

type Props = TableHTMLAttributes<HTMLTableElement> & {
  caption?: ReactNode;
};

export function Table({ caption, className, children, ...rest }: Props) {
  const classes = [styles.table, className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={styles.wrapper}>
      <table className={classes} {...rest}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}
