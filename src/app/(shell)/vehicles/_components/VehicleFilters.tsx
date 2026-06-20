"use client";

import { Input, Select } from "@/components";
import type { VehicleFilterState } from "./applyVehicleFilters";
import styles from "./VehicleFilters.module.css";

type Props = {
  value: VehicleFilterState;
  onChange: (next: VehicleFilterState) => void;
  totalCount: number;
  matchedCount: number;
};

const STATUS_OPTIONS: Array<{ value: VehicleFilterState["status"]; label: string }> = [
  { value: "any", label: "Any status" },
  { value: "registered", label: "Registered" },
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "decommissioned", label: "Decommissioned" },
];

const TYPE_OPTIONS: Array<{ value: VehicleFilterState["type"]; label: string }> = [
  { value: "any", label: "Any type" },
  { value: "passenger", label: "Passenger" },
  { value: "truck", label: "Truck" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bus", label: "Bus" },
];

export function VehicleFilters({
  value,
  onChange,
  totalCount,
  matchedCount,
}: Props) {
  return (
    <div className={styles.filters} role="search" aria-label="Vehicles filters">
      <Input
        id="vehicle-search"
        label="Search"
        placeholder="Plate, model or VIN"
        value={value.search}
        onChange={(event) =>
          onChange({ ...value, search: event.target.value })
        }
      />
      <Select
        id="vehicle-status"
        label="Status"
        value={value.status}
        onChange={(event) =>
          onChange({
            ...value,
            status: event.target.value as VehicleFilterState["status"],
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
        id="vehicle-type"
        label="Vehicle type"
        value={value.type}
        onChange={(event) =>
          onChange({
            ...value,
            type: event.target.value as VehicleFilterState["type"],
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
