"use client";

import { Input, Select } from "@/components";
import type { EvidenceFilterState } from "./applyEvidenceFilters";
import styles from "./EvidenceFilters.module.css";

type Props = {
  value: EvidenceFilterState;
  onChange: (next: EvidenceFilterState) => void;
  totalCount: number;
  matchedCount: number;
};

const STATUS_OPTIONS: Array<{
  value: EvidenceFilterState["status"];
  label: string;
}> = [
  { value: "any", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "finalized", label: "Finalized" },
  { value: "failed", label: "Failed" },
];

const MODALITY_OPTIONS: Array<{
  value: EvidenceFilterState["modality"];
  label: string;
}> = [
  { value: "any", label: "Any modality" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
];

export function EvidenceFilters({
  value,
  onChange,
  totalCount,
  matchedCount,
}: Props) {
  return (
    <div
      className={styles.filters}
      role="search"
      aria-label="Evidence filters"
    >
      <Input
        id="evidence-search"
        label="Search"
        placeholder="Recording id, exam id or source"
        value={value.search}
        onChange={(event) =>
          onChange({ ...value, search: event.target.value })
        }
      />
      <Select
        id="evidence-status"
        label="Status"
        value={value.status}
        onChange={(event) =>
          onChange({
            ...value,
            status: event.target.value as EvidenceFilterState["status"],
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
        id="evidence-modality"
        label="Modality"
        value={value.modality}
        onChange={(event) =>
          onChange({
            ...value,
            modality: event.target.value as EvidenceFilterState["modality"],
          })
        }
      >
        {MODALITY_OPTIONS.map((opt) => (
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
