import { forwardRef } from "react";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import styles from "./Field.module.css";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  function Textarea(
    { label, hint, invalid, id, className, rows = 4, ...rest },
    ref,
  ) {
    const hintId = hint && id ? `${id}-hint` : undefined;

    return (
      <label className={styles.field}>
        {label ? <span className={styles.label}>{label}</span> : null}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          className={[
            styles.control,
            styles.textarea,
            invalid ? styles.invalid : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {hint ? (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </label>
    );
  },
);
