"use client";

import { useMemo, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { getApiAdapter } from "@/api/get-api-adapter";
import {
  ApiErrorView,
  Button,
  DegradedState,
  EmptyState,
  Skeleton,
} from "@/components";
import {
  DEFAULT_FILTERS,
  applyVehicleFilters,
  type VehicleFilterState,
} from "./applyVehicleFilters";
import { VehicleDetail } from "./VehicleDetail";
import { VehicleFilters } from "./VehicleFilters";
import { VehicleRegisterForm } from "./VehicleRegisterForm";
import { VehiclesTable } from "./VehiclesTable";
import { useVehiclesData, type Vehicle } from "./useVehiclesData";
import styles from "./VehicleWorkspace.module.css";

type Props = {
  api?: AutodromeApi;
};

export function VehicleWorkspace({ api }: Props) {
  const resolvedApi = useMemo(() => api ?? getApiAdapter(), [api]);
  const state = useVehiclesData(resolvedApi);

  const [filters, setFilters] = useState<VehicleFilterState>(
    DEFAULT_FILTERS,
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );
  const [registerOpen, setRegisterOpen] = useState(false);

  const visible = useMemo(
    () => applyVehicleFilters(state.vehicles, filters),
    [state.vehicles, filters],
  );

  const selected: Vehicle | undefined = useMemo(
    () =>
      state.vehicles.find((v) => v.vehicleId === selectedId) ?? undefined,
    [state.vehicles, selectedId],
  );

  return (
    <section className={styles.workspace} aria-label="Vehicle workspace">
      <header className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Vehicles</h1>
          <p className={styles.subtitle}>
            Fleet registry, equipment placeholders and telemetry slot. Data
            via <span className={styles.mono}>getApiAdapter()</span>.
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={state.reload}>
            Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRegisterOpen(true)}
          >
            Register vehicle
          </Button>
        </div>
      </header>

      {state.degraded ? (
        <DegradedState
          service="vehicle-service"
          onRetry={state.reload}
          description="Showing nothing while the service is degraded."
        />
      ) : null}

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      <VehicleFilters
        value={filters}
        onChange={setFilters}
        totalCount={state.vehicles.length}
        matchedCount={visible.length}
      />

      <div className={styles.body}>
        <div className={styles.listColumn}>
          {state.loading ? (
            <Skeleton lines={6} label="Loading vehicles" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No vehicles"
              description={
                state.vehicles.length === 0
                  ? "No vehicles in this scenario."
                  : "No vehicles match current filters."
              }
            />
          ) : (
            <VehiclesTable
              vehicles={visible}
              selectedId={selectedId}
              onSelect={(vehicle) => setSelectedId(vehicle.vehicleId)}
            />
          )}
        </div>
        {selected ? (
          <VehicleDetail
            vehicle={selected}
            onClose={() => setSelectedId(undefined)}
          />
        ) : null}
      </div>

      <VehicleRegisterForm
        api={resolvedApi}
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => state.reload()}
      />
    </section>
  );
}
