"use client";

import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  DegradedState,
  EmptyState,
  Skeleton,
} from "@/components";
import {
  DEFAULT_FILTERS,
  applyServiceHealthFilters,
  type ServiceHealthFilterState,
} from "./applyServiceHealthFilters";
import { ServiceHealthDetail } from "./ServiceHealthDetail";
import { ServiceHealthFilters } from "./ServiceHealthFilters";
import { ServiceHealthTable } from "./ServiceHealthTable";
import type { ServiceHealth } from "./serviceHealth";
import {
  useServiceHealthData,
  type ServiceHealthLoader,
} from "./useServiceHealthData";
import styles from "./ServiceHealthDashboard.module.css";

type Props = {
  loader?: ServiceHealthLoader;
};

export function ServiceHealthDashboard({ loader }: Props) {
  const state = useServiceHealthData(loader);

  const [filters, setFilters] = useState<ServiceHealthFilterState>(
    DEFAULT_FILTERS,
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );

  const visible = useMemo(
    () => applyServiceHealthFilters(state.services, filters),
    [state.services, filters],
  );

  const selected: ServiceHealth | undefined = useMemo(
    () =>
      state.services.find((s) => s.id === selectedId) ?? undefined,
    [state.services, selectedId],
  );

  return (
    <section
      className={styles.dashboard}
      aria-label="Service health dashboard"
    >
      <header className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Operations</h1>
          <p className={styles.subtitle}>
            Health and readiness of backend, edge and deployment
            services on this local node. Reload to fetch the latest
            probe results.
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={state.reload}>
            Reload
          </Button>
        </div>
      </header>

      {state.degraded ? (
        <DegradedState
          service="operations · service health"
          onRetry={state.reload}
        />
      ) : null}

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      <ServiceHealthFilters
        value={filters}
        onChange={setFilters}
        totalCount={state.services.length}
        matchedCount={visible.length}
      />

      <div className={styles.body}>
        <div className={styles.listColumn}>
          {state.loading ? (
            <Skeleton lines={6} label="Loading service health" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No services"
              description={
                state.services.length === 0
                  ? "No services reported in this scenario."
                  : "No services match current filters."
              }
            />
          ) : (
            <ServiceHealthTable
              services={visible}
              selectedId={selectedId}
              onSelect={(s) => setSelectedId(s.id)}
            />
          )}
        </div>
        {selected ? (
          <ServiceHealthDetail
            key={selected.id}
            service={selected}
            onClose={() => setSelectedId(undefined)}
          />
        ) : null}
      </div>
    </section>
  );
}
