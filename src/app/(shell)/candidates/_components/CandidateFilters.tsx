"use client";

import { Input, Select } from "@/components";
import type {
  CandidateFilterState,
} from "./applyCandidateFilters";
import styles from "./CandidateFilters.module.css";

type Props = {
  value: CandidateFilterState;
  onChange: (next: CandidateFilterState) => void;
  totalCount: number;
  matchedCount: number;
};

const STATUS_OPTIONS: Array<{ value: CandidateFilterState["status"]; label: string }> = [
  { value: "any", label: "Any status" },
  { value: "registered", label: "Registered" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
  { value: "deleted", label: "Deleted" },
];

export function CandidateFilters({
  value,
  onChange,
  totalCount,
  matchedCount,
}: Props) {
  return (
    <div className={styles.filters} role="search" aria-label="Candidates filters">
      <Input
        id="candidate-search"
        label="Search"
        placeholder="Name or document number"
        value={value.search}
        onChange={(event) =>
          onChange({ ...value, search: event.target.value })
        }
      />
      <Select
        id="candidate-status"
        label="Status"
        value={value.status}
        onChange={(event) =>
          onChange({
            ...value,
            status: event.target.value as CandidateFilterState["status"],
          })
        }
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <p className={styles.summary} aria-live="polite">
        Showing {matchedCount} of {totalCount}
      </p>
    </div>
  );
}
