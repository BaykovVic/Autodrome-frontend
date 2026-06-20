"use client";

import { Input, Select } from "@/components";
import type { ExerciseFilterState } from "./applyExerciseFilters";
import styles from "./ExerciseFilters.module.css";

type Props = {
  value: ExerciseFilterState;
  onChange: (next: ExerciseFilterState) => void;
  totalCount: number;
  matchedCount: number;
};

const STATUS_OPTIONS: Array<{
  value: ExerciseFilterState["status"];
  label: string;
}> = [
  { value: "any", label: "Any status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function ExerciseFilters({
  value,
  onChange,
  totalCount,
  matchedCount,
}: Props) {
  return (
    <div
      className={styles.filters}
      role="search"
      aria-label="Exercises filters"
    >
      <Input
        id="exercise-search"
        label="Search"
        placeholder="Title, code or description"
        value={value.search}
        onChange={(event) =>
          onChange({ ...value, search: event.target.value })
        }
      />
      <Input
        id="exercise-code"
        label="Code"
        placeholder="Filter by code substring"
        value={value.code}
        onChange={(event) =>
          onChange({ ...value, code: event.target.value })
        }
      />
      <Select
        id="exercise-status"
        label="Status"
        value={value.status}
        onChange={(event) =>
          onChange({
            ...value,
            status: event.target.value as ExerciseFilterState["status"],
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
