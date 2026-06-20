"use client";

import { Input, Select } from "@/components";
import type { RuleFilterState } from "./applyRuleFilters";
import styles from "./RuleFilters.module.css";

type Props = {
  value: RuleFilterState;
  onChange: (next: RuleFilterState) => void;
  totalCount: number;
  matchedCount: number;
};

const STATUS_OPTIONS: Array<{
  value: RuleFilterState["status"];
  label: string;
}> = [
  { value: "any", label: "Any status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function RuleFilters({
  value,
  onChange,
  totalCount,
  matchedCount,
}: Props) {
  return (
    <div
      className={styles.filters}
      role="search"
      aria-label="Rules filters"
    >
      <Input
        id="rule-search"
        label="Search"
        placeholder="Title, description or rule id"
        value={value.search}
        onChange={(event) =>
          onChange({ ...value, search: event.target.value })
        }
      />
      <Input
        id="rule-violation-id"
        label="Violation id"
        placeholder="Filter by violation UUID substring"
        value={value.violationId}
        onChange={(event) =>
          onChange({ ...value, violationId: event.target.value })
        }
      />
      <Select
        id="rule-status"
        label="Status"
        value={value.status}
        onChange={(event) =>
          onChange({
            ...value,
            status: event.target.value as RuleFilterState["status"],
          })
        }
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <p className={styles.summary} aria-live="polite">
        Showing {matchedCount} of {totalCount}
      </p>
    </div>
  );
}
