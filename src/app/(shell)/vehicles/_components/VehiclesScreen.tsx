"use client";

import { useMemo, useState } from "react";

import {
  Button,
  EmptyState,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  useConsoleVehicles,
  type ConsoleVehiclesLoader,
} from "./useConsoleVehicles";
import type {
  ConsoleVehicle,
  VehicleDeviceState,
  VehicleEquipmentState,
} from "./consoleRegistrySnapshot";
import styles from "./VehiclesScreen.module.css";

type Props = {
  loader?: ConsoleVehiclesLoader;
};

function deviceDot(state: VehicleDeviceState): StatusDotVariant {
  switch (state) {
    case "online":
      return "online";
    case "degraded":
      return "degraded";
    case "offline":
      return "offline";
    case "standby":
    default:
      return "standby";
  }
}

function deviceBadge(state: VehicleDeviceState): StatusBadgeVariant {
  switch (state) {
    case "online":
      return "success";
    case "degraded":
      return "warning";
    case "offline":
      return "danger";
    case "standby":
    default:
      return "neutral";
  }
}

function equipmentDot(state: VehicleEquipmentState): StatusDotVariant {
  switch (state) {
    case "ok":
      return "online";
    case "watch":
      return "degraded";
    case "fault":
    default:
      return "offline";
  }
}

function equipmentBadge(state: VehicleEquipmentState): StatusBadgeVariant {
  switch (state) {
    case "ok":
      return "success";
    case "watch":
      return "warning";
    case "fault":
    default:
      return "danger";
  }
}

export function VehiclesScreen({ loader }: Props) {
  const state = useConsoleVehicles(loader);

  const [search, setSearch] = useState("");
  const [deviceFilter, setDeviceFilter] =
    useState<VehicleDeviceState | "any">("any");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );

  const vehicles = useMemo(
    () => state.snapshot?.vehicles ?? [],
    [state.snapshot],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (deviceFilter !== "any" && v.device.state !== deviceFilter) {
        return false;
      }
      if (needle.length === 0) return true;
      return [v.id, v.plate, v.model, v.category]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [vehicles, search, deviceFilter]);

  const selected: ConsoleVehicle | undefined = useMemo(() => {
    if (selectedId) {
      const match = vehicles.find((v) => v.id === selectedId);
      if (match) return match;
    }
    return visible[0] ?? vehicles[0];
  }, [vehicles, visible, selectedId]);

  return (
    <section className={styles.screen} aria-label="Vehicles registry">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Vehicles</h1>
            <p className={styles.subtitle}>
              {state.snapshot
                ? `${state.snapshot.totals.total} vehicles · ${state.snapshot.totals.degraded} degraded, ${state.snapshot.totals.offline} offline`
                : "Loading registry…"}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled
            title="Device re-poll lands with the device-control feature."
          >
            Re-poll devices
          </Button>
        </div>
        <div
          className={styles.filters}
          role="search"
          aria-label="Vehicles filters"
        >
          <input
            className={styles.search}
            placeholder="Search plate or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
          <select
            className={styles.select}
            value={deviceFilter}
            onChange={(e) =>
              setDeviceFilter(e.target.value as VehicleDeviceState | "any")
            }
            aria-label="Device state"
          >
            <option value="any">All device states</option>
            <option value="online">Online</option>
            <option value="degraded">Degraded</option>
            <option value="offline">Offline</option>
            <option value="standby">Standby</option>
          </select>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.tableColumn}>
          {visible.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                title="No vehicles"
                description={
                  vehicles.length === 0
                    ? "No vehicles in this scenario."
                    : "No vehicles match current filters."
                }
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>Vehicle</th>
                  <th scope="col" className={styles.th}>Plate</th>
                  <th scope="col" className={styles.th}>Cat</th>
                  <th scope="col" className={styles.th}>Onboard device</th>
                  <th
                    scope="col"
                    className={`${styles.th} ${styles.thRight}`}
                  >
                    Last seen
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
                      onClick={() => setSelectedId(v.id)}
                      aria-selected={isSelected}
                    >
                      <td className={styles.td}>
                        <div className={styles.vehicleModel}>{v.model}</div>
                        <div className={styles.mono}>{v.id}</div>
                      </td>
                      <td className={`${styles.td} ${styles.mono}`}>
                        {v.plate}
                      </td>
                      <td className={`${styles.td} ${styles.mono}`}>
                        {v.category}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.deviceCell}>
                          <StatusDot
                            variant={deviceDot(v.device.state)}
                            halo={false}
                          />
                          <StatusBadge variant={deviceBadge(v.device.state)}>
                            {v.device.label}
                          </StatusBadge>
                        </span>
                      </td>
                      <td
                        className={`${styles.td} ${styles.tdRight} ${styles.mono}`}
                      >
                        {v.lastSeen}
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
            aria-label={`Vehicle ${selected.id}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailIdentity}>
                <div className={styles.detailName}>{selected.model}</div>
                <div className={styles.mono}>
                  {selected.id} · {selected.plate}
                </div>
                <StatusBadge variant={deviceBadge(selected.device.state)}>
                  {selected.device.label}
                </StatusBadge>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Equipment health</div>
              <ul className={styles.equipmentList}>
                {selected.equipment.map((row) => (
                  <li key={row.name} className={styles.equipmentRow}>
                    <span className={styles.equipmentName}>{row.name}</span>
                    <span className={styles.equipmentBadge}>
                      <StatusDot
                        variant={equipmentDot(row.state)}
                        halo={false}
                      />
                      <StatusBadge variant={equipmentBadge(row.state)}>
                        {row.label}
                      </StatusBadge>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Device</div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Firmware</dt>
                  <dd className={`${styles.detailValue} ${styles.mono}`}>
                    {selected.firmware}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Last telemetry</dt>
                  <dd className={`${styles.detailValue} ${styles.mono}`}>
                    {selected.lastSeen}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailActions}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled
                title="Diagnostics lands with the device-control feature."
              >
                Diagnostics
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled
                title="Take-offline lands with the device-control feature."
              >
                Take offline
              </Button>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
