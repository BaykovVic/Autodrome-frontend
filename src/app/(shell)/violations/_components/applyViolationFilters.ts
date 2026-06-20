import type { Severity, Violation } from "./useViolationsData";

export type ViolationFilterState = {
  search: string;
  severity: Severity | "any";
};

export const DEFAULT_FILTERS: ViolationFilterState = {
  search: "",
  severity: "any",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function applyViolationFilters(
  violations: Violation[],
  filters: ViolationFilterState,
): Violation[] {
  const needle = normalize(filters.search);
  return violations.filter((violation) => {
    if (
      filters.severity !== "any" &&
      violation.severity !== filters.severity
    ) {
      return false;
    }
    if (needle.length === 0) return true;
    const haystack = normalize(
      [violation.code, violation.title, violation.description ?? ""].join(
        " ",
      ),
    );
    return haystack.includes(needle);
  });
}
