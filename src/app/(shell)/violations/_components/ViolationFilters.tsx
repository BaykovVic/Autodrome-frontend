"use client";

import { Input, Select } from "@/components";
import type { ViolationFilterState } from "./applyViolationFilters";
import styles from "./ViolationFilters.module.css";

type Props = {
  value: ViolationFilterState;
  onChange: (next: ViolationFilterState) => void;
  totalCount: number;
  matchedCount: number;
};

const SEVERITY_OPTIONS: Array<{
  value: ViolationFilterState["severity"];
  label: string;
}> = [
  { value: "any", label: "Any severity" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function ViolationFilters({
  value,
  onChange,
  totalCount,
  matchedCount,
}: Props) {
  return (
    <div
      className={styles.filters}
      role="search"
      aria-label="Violations filters"
    >
      <Input
        id="violation-search"
        label="Search"
        placeholder="Code, title or description"
        value={value.search}
        onChange={(event) =>
          onChange({ ...value, search: event.target.value })
        }
      />
      <Select
        id="violation-severity"
        label="Severity"
        value={value.severity}
        onChange={(event) =>
          onChange({
            ...value,
            severity: event.target
              .value as ViolationFilterState["severity"],
          })
        }
      >
        {SEVERITY_OPTIONS.map((opt) => (
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
