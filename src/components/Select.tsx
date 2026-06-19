import { forwardRef } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import styles from "./Field.module.css";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, hint, invalid, id, className, children, ...rest },
  ref,
) {
  const hintId = hint && id ? `${id}-hint` : undefined;

  return (
    <label className={styles.field}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <select
        ref={ref}
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
        className={[
          styles.control,
          invalid ? styles.invalid : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </select>
      {hint ? (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      ) : null}
    </label>
  );
});
