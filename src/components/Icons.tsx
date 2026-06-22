/**
 * Inline SVG icons used across the Autodrome Console shell.
 *
 * Paths are lifted from the Web Operator Console reference
 * (`design/web-operator-console/Web Operator Console.dc.html`)
 * for the create/refresh/search affordances that previously
 * lived only in the design HTML. Each icon uses
 * `stroke="currentColor"` so it inherits Button/input color
 * tokens, and `aria-hidden="true"` because every site uses
 * adjacent text labels for accessibility.
 */

type Size = {
  width?: number;
  height?: number;
};

export function PlusIcon({ width = 14, height = 14 }: Size = {}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function RefreshIcon({ width = 14, height = 14 }: Size = {}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

export function SearchIcon({ width = 14, height = 14 }: Size = {}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
