import type { RuleDefinition, RuleStatus } from "./useRulesData";

export type RuleFilterState = {
  search: string;
  status: RuleStatus | "any";
  violationId: string;
};

export const DEFAULT_FILTERS: RuleFilterState = {
  search: "",
  status: "any",
  violationId: "",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function applyRuleFilters(
  rules: RuleDefinition[],
  filters: RuleFilterState,
): RuleDefinition[] {
  const needle = normalize(filters.search);
  const violationNeedle = normalize(filters.violationId);
  return rules.filter((rule) => {
    if (filters.status !== "any" && rule.status !== filters.status) {
      return false;
    }
    if (
      violationNeedle &&
      !normalize(rule.violationRef.violationId).includes(violationNeedle)
    ) {
      return false;
    }
    if (needle.length === 0) return true;
    const haystack = normalize(
      [rule.title ?? "", rule.description ?? "", rule.ruleId].join(" "),
    );
    return haystack.includes(needle);
  });
}
