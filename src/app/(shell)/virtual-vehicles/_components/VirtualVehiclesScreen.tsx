"use client";

import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  useConsoleVirtualVehicles,
  type ConsoleVirtualVehiclesLoader,
} from "./useConsoleVirtualVehicles";
import {
  VIRTUAL_VEHICLE_SOURCE_LABELS,
  type ConsoleVirtualVehicle,
  type ConsoleVirtualVehicleSource,
  type ConsoleVirtualVehicleStatus,
} from "./consoleVirtualVehiclesSnapshot";
import styles from "./VirtualVehiclesScreen.module.css";

type Props = {
  loader?: ConsoleVirtualVehiclesLoader;
};

type StatusFilter = ConsoleVirtualVehicleStatus | "all";

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "idle", label: "Idle" },
  { id: "paused", label: "Paused" },
  { id: "degraded", label: "Degraded" },
  { id: "stopped", label: "Stopped" },
];

function statusDot(state: ConsoleVirtualVehicleStatus): StatusDotVariant {
  switch (state) {
    case "running":
      return "online";
    case "idle":
      return "standby";
    case "paused":
      return "standby";
    case "degraded":
      return "degraded";
    case "stopped":
    default:
      return "offline";
  }
}

function statusBadge(
  state: ConsoleVirtualVehicleStatus,
): StatusBadgeVariant {
  switch (state) {
    case "running":
      return "success";
    case "idle":
      return "neutral";
    case "paused":
      return "info";
    case "degraded":
      return "warning";
    case "stopped":
    default:
      return "neutral";
  }
}

function sourceLabel(src: ConsoleVirtualVehicleSource): string {
  return VIRTUAL_VEHICLE_SOURCE_LABELS[src] ?? src;
}

export function VirtualVehiclesScreen({ loader }: Props) {
  const state = useConsoleVirtualVehicles(loader);

  const [tab, setTab] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );

  const vehicles = useMemo(
    () => state.snapshot?.vehicles ?? [],
    [state.snapshot],
  );

  const visible = useMemo(() => {
    if (tab === "all") return vehicles;
    return vehicles.filter((v) => v.status === tab);
  }, [vehicles, tab]);

  const selected: ConsoleVirtualVehicle | undefined = useMemo(() => {
    if (selectedId) {
      const match = vehicles.find((v) => v.id === selectedId);
      if (match) return match;
    }
    return visible[0] ?? vehicles[0];
  }, [vehicles, visible, selectedId]);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Virtual Vehicles">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading virtual vehicles" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Virtual Vehicles">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const totals = state.snapshot?.totals ?? {
    total: 0,
    running: 0,
    idle: 0,
    degraded: 0,
  };

  return (
    <section className={styles.screen} aria-label="Virtual Vehicles">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Virtual Vehicles</h1>
            <p className={styles.subtitle}>
              {totals.total} sessions · {totals.running} running ·{" "}
              {totals.idle} idle · {totals.degraded} degraded
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled
            title="Spawn a new virtual vehicle session — flow lands with the upcoming virtual-vehicle live API integration feature."
          >
            New session
          </Button>
        </div>
        <div
          className={styles.filters}
          role="tablist"
          aria-label="Virtual vehicle status filter"
        >
          {STATUS_TABS.map((t) => {
            const isActive = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={
                  isActive
                    ? `${styles.tab} ${styles.tabActive}`
                    : styles.tab
                }
                onClick={() => {
                  setTab(t.id);
                  setSelectedId(undefined);
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.tableColumn}>
          {visible.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                title="No virtual vehicles"
                description={
                  vehicles.length === 0
                    ? "No virtual vehicle sessions registered in this scenario."
                    : "No virtual vehicles match this filter."
                }
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>
                    Vehicle
                  </th>
                  <th scope="col" className={styles.th}>
                    Source
                  </th>
                  <th scope="col" className={styles.th}>
                    Scenario
                  </th>
                  <th scope="col" className={styles.th}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((v) => {
                  const isSelected = v.id === selected?.id;
                  return (
                    <tr
                      key={v.id}
                      className={
                        isSelected
                          ? `${styles.row} ${styles.rowActive}`
                          : styles.row
                      }
                      aria-selected={isSelected}
                    >
                      <td className={styles.td}>
                        <button
                          type="button"
                          className={styles.vehicleBtn}
                          onClick={() => setSelectedId(v.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          <span className={styles.vehicleId}>{v.id}</span>
                          <span className={styles.vehicleLabel}>
                            {v.label}
                          </span>
                        </button>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.sourceCell}>
                          <span className={styles.sourceLabel}>
                            {sourceLabel(v.source)}
                          </span>
                          <span className={styles.sourceCanonicalChip}>
                            ({v.source})
                          </span>
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div>{v.scenarioLabel}</div>
                        <div className={styles.mono}>{v.scenarioId}</div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot
                            variant={statusDot(v.status)}
                            halo={false}
                          />
                          <StatusBadge variant={statusBadge(v.status)}>
                            {v.statusLabel}
                          </StatusBadge>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected ? (
          <aside
            className={styles.detail}
            aria-label={`Virtual vehicle ${selected.id}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailIdentity}>
                <span className={styles.detailId}>{selected.id}</span>
                <span className={styles.statusCell}>
                  <StatusDot
                    variant={statusDot(selected.status)}
                    halo={false}
                  />
                  <StatusBadge variant={statusBadge(selected.status)}>
                    {selected.statusLabel}
                  </StatusBadge>
                </span>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Identity</div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Label</dt>
                  <dd className={styles.detailValue}>{selected.label}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Source</dt>
                  <dd className={styles.detailValue}>
                    {sourceLabel(selected.source)}{" "}
                    <span className={styles.sourceCanonicalChip}>
                      ({selected.source})
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Scenario</div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Name</dt>
                  <dd className={styles.detailValue}>
                    {selected.scenarioLabel}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>ID</dt>
                  <dd
                    className={`${styles.detailValue} ${styles.detailValueMono}`}
                  >
                    {selected.scenarioId}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Telemetry</div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Started</dt>
                  <dd className={styles.detailValue}>
                    {selected.startedAt}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Last telemetry</dt>
                  <dd className={styles.detailValue}>
                    {selected.lastTelemetryAt}
                  </dd>
                </div>
              </dl>
              {selected.notes ? (
                <p className={styles.notesText}>{selected.notes}</p>
              ) : null}
            </div>

            <div className={styles.detailActions}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled
                title="Stop the session — flow lands with the upcoming virtual-vehicle live API integration feature."
              >
                Stop
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled
                title="Pause/resume — flow lands with the upcoming virtual-vehicle live API integration feature."
              >
                Pause
              </Button>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
