"use client";

import { Input, Select } from "@/components";
import type { ExamFilterState } from "./applyExamFilters";
import styles from "./ExamFilters.module.css";

type Props = {
  value: ExamFilterState;
  onChange: (next: ExamFilterState) => void;
  totalCount: number;
  matchedCount: number;
};

const STATUS_OPTIONS: Array<{ value: ExamFilterState["status"]; label: string }> = [
  { value: "any", label: "Any status" },
  { value: "scheduled", label: "Scheduled" },
  { value: "inProgress", label: "In progress" },
  { value: "finished", label: "Finished" },
  { value: "aborted", label: "Aborted" },
];

const TYPE_OPTIONS: Array<{ value: ExamFilterState["examType"]; label: string }> = [
  { value: "any", label: "Any type" },
  { value: "autodromeBasic", label: "Autodrome basic" },
  { value: "autodromeAdvanced", label: "Autodrome advanced" },
  { value: "retest", label: "Retest" },
];

export function ExamFilters({
  value,
  onChange,
  totalCount,
  matchedCount,
}: Props) {
  return (
    <div className={styles.filters} role="search" aria-label="Exams filters">
      <Input
        id="exam-search"
        label="Search"
        placeholder="Exam, candidate or vehicle id"
        value={value.search}
        onChange={(event) =>
          onChange({ ...value, search: event.target.value })
        }
      />
      <Select
        id="exam-status"
        label="Status"
        value={value.status}
        onChange={(event) =>
          onChange({
            ...value,
            status: event.target.value as ExamFilterState["status"],
          })
        }
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <Select
        id="exam-type"
        label="Exam type"
        value={value.examType}
        onChange={(event) =>
          onChange({
            ...value,
            examType: event.target.value as ExamFilterState["examType"],
          })
        }
      >
        {TYPE_OPTIONS.map((opt) => (
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
