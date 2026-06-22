import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
};

/**
 * Returns the Button visual classes so non-button interactive
 * elements (most commonly `<a>` / Next `<Link>`) can adopt the same
 * appearance without nesting a real `<button>` inside a link — that
 * combination is invalid HTML and breaks keyboard/focus behaviour
 * on the wrapper.
 */
export function buttonClassName(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
} = {}): string {
  const { variant = "secondary", size = "md", iconOnly = false } = opts;
  return [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    iconOnly ? styles.iconOnly : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "secondary",
    size = "md",
    iconOnly = false,
    className,
    type = "button",
    children,
    ...rest
  },
  ref,
) {
  const classes = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    iconOnly ? styles.iconOnly : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {children}
    </button>
  );
});
