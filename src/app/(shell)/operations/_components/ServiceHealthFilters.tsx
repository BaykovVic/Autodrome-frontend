"use client";

import { Input, Select } from "@/components";
import type { ServiceHealthFilterState } from "./applyServiceHealthFilters";
import styles from "./ServiceHealthFilters.module.css";

type Props = {
  value: ServiceHealthFilterState;
  onChange: (next: ServiceHealthFilterState) => void;
  totalCount: number;
  matchedCount: number;
};

const KIND_OPTIONS: Array<{
  value: ServiceHealthFilterState["kind"];
  label: string;
}> = [
  { value: "any", label: "Any kind" },
  { value: "backend", label: "Backend" },
  { value: "edge", label: "Edge" },
  { value: "deploy", label: "Deploy" },
];

const LIVENESS_OPTIONS: Array<{
  value: ServiceHealthFilterState["liveness"];
  label: string;
}> = [
  { value: "any", label: "Any state" },
  { value: "healthy", label: "Healthy" },
  { value: "degraded", label: "Degraded" },
  { value: "down", label: "Down" },
  { value: "unknown", label: "Unknown" },
];

export function ServiceHealthFilters({
  value,
  onChange,
  totalCount,
  matchedCount,
}: Props) {
  return (
    <div
      className={styles.filters}
      role="search"
      aria-label="Service health filters"
    >
      <Input
        id="service-health-search"
        label="Search"
        placeholder="Service name or id"
        value={value.search}
        onChange={(event) =>
          onChange({ ...value, search: event.target.value })
        }
      />
      <Select
        id="service-health-kind"
        label="Kind"
        value={value.kind}
        onChange={(event) =>
          onChange({
            ...value,
            kind: event.target.value as ServiceHealthFilterState["kind"],
          })
        }
      >
        {KIND_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <Select
        id="service-health-liveness"
        label="Liveness"
        value={value.liveness}
        onChange={(event) =>
          onChange({
            ...value,
            liveness: event.target
              .value as ServiceHealthFilterState["liveness"],
          })
        }
      >
        {LIVENESS_OPTIONS.map((opt) => (
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
