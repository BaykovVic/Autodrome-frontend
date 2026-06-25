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
  useConsoleAndroidDevices,
  type ConsoleAndroidDevicesLoader,
} from "./useConsoleAndroidDevices";
import {
  ANDROID_CAPABILITY_LABELS,
  type ConsoleAndroidDevice,
  type ConsoleAndroidDeviceCapability,
  type ConsoleAndroidDeviceStatus,
} from "./consoleAndroidDevicesSnapshot";
import { AndroidDeviceAssignDialog } from "./AndroidDeviceAssignDialog";
import { AndroidDevicePolicyEditor } from "./AndroidDevicePolicyEditor";
import { AndroidDeviceRetireDialog } from "./AndroidDeviceRetireDialog";
import styles from "./AndroidDevicesScreen.module.css";

type Props = {
  loader?: ConsoleAndroidDevicesLoader;
  /**
   * Stable "now" timestamp injected into the policy editor +
   * mock assign/retire mutations (assignedAt / retiredAt) for
   * deterministic mock state. Falls back to a fixed pilot-window
   * value so non-test consumers also see a stable snapshot until
   * live wiring lands.
   */
  policyEditorNow?: string;
};

const DEFAULT_POLICY_EDITOR_NOW = "2026-06-24T00:00:00Z";

type StatusFilter = ConsoleAndroidDeviceStatus | "all";

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "retired", label: "Retired" },
];

function statusDot(state: ConsoleAndroidDeviceStatus): StatusDotVariant {
  switch (state) {
    case "active":
      return "online";
    case "pending":
      return "standby";
    case "retired":
    default:
      return "offline";
  }
}

function statusBadge(
  state: ConsoleAndroidDeviceStatus,
): StatusBadgeVariant {
  switch (state) {
    case "active":
      return "success";
    case "pending":
      return "info";
    case "retired":
    default:
      return "neutral";
  }
}

function heartbeatDot(
  status: NonNullable<
    ConsoleAndroidDevice["heartbeat"]
  >["status"],
): StatusDotVariant {
  switch (status) {
    case "online":
      return "online";
    case "degraded":
      return "degraded";
    case "offline":
    default:
      return "offline";
  }
}

function formatBattery(level: number | undefined): string {
  if (typeof level !== "number") return "—";
  return `${Math.round(level * 100)}%`;
}

function capabilityLabel(cap: ConsoleAndroidDeviceCapability): string {
  return ANDROID_CAPABILITY_LABELS[cap] ?? cap;
}

export function AndroidDevicesScreen({
  loader,
  policyEditorNow = DEFAULT_POLICY_EDITOR_NOW,
}: Props) {
  const state = useConsoleAndroidDevices({
    loader,
    now: policyEditorNow,
  });

  const [tab, setTab] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );
  const [policyEditorOpen, setPolicyEditorOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);

  const devices = useMemo(
    () => state.snapshot?.devices ?? [],
    [state.snapshot],
  );

  const visible = useMemo(() => {
    if (tab === "all") return devices;
    return devices.filter((d) => d.status === tab);
  }, [devices, tab]);

  const selected: ConsoleAndroidDevice | undefined = useMemo(() => {
    if (selectedId) {
      const match = devices.find((d) => d.id === selectedId);
      if (match) return match;
    }
    return visible[0] ?? devices[0];
  }, [devices, visible, selectedId]);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Android Devices">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading devices" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Android Devices">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const totals = state.snapshot?.totals ?? {
    devices: 0,
    pending: 0,
    active: 0,
    retired: 0,
  };

  // Affordance enablement rules (assign + retire command UI):
  //   - "Edit policy" is enabled for active devices; pending and
  //     retired stay disabled with status-specific tooltips.
  //   - "Assign" is enabled for pending OR active devices and
  //     opens the dedicated assignment dialog. Retired devices
  //     cannot be re-bound (canonical lifecycle: retire is
  //     terminal).
  //   - "Retire" is enabled for non-retired devices and opens the
  //     dedicated retire dialog (two-step flow с safe-confirm).
  //     Already-retired devices show the "already retired"
  //     tooltip.
  //   - Both dialogs dispatch through the hook's dual-path
  //     `assignDevice` / `retireDevice` API — mock mode mutates
  //     the local snapshot; live mode dispatches POST /assign or
  //     POST /retire and surfaces `503 ANDROID_DEVICE_NOT_IMPLEMENTED`
  //     through `<ApiErrorView>` instead of fake success.
  const isRetired = selected?.status === "retired";
  const isPending = selected?.status === "pending";

  return (
    <section className={styles.screen} aria-label="Android Devices">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Android Devices</h1>
            <p className={styles.subtitle}>
              {totals.devices} devices · {totals.pending} pending ·{" "}
              {totals.active} active · {totals.retired} retired
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled
            title="Live admin commands land in the upcoming android device live API integration feature."
          >
            Refresh
          </Button>
        </div>
        <div
          className={styles.filters}
          role="tablist"
          aria-label="Android device status filter"
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
                title="No devices"
                description={
                  devices.length === 0
                    ? "No Android devices registered in this scenario."
                    : "No devices match this filter."
                }
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>
                    Device
                  </th>
                  <th scope="col" className={styles.th}>
                    Role / binding
                  </th>
                  <th scope="col" className={styles.th}>
                    Status
                  </th>
                  <th scope="col" className={styles.th}>
                    Heartbeat
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((d) => {
                  const isSelected = d.id === selected?.id;
                  return (
                    <tr
                      key={d.id}
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
                          className={styles.deviceBtn}
                          onClick={() => setSelectedId(d.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          <span className={styles.deviceId}>{d.id}</span>
                          <span className={styles.deviceMeta}>
                            {d.platform.model} · {d.platform.appVersion}
                          </span>
                        </button>
                      </td>
                      <td className={styles.td}>
                        <div>{d.roleLabel ?? "—"}</div>
                        <div className={styles.mono}>
                          {d.binding
                            ? `${d.binding.type} · ${d.binding.anchorId}`
                            : "—"}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot
                            variant={statusDot(d.status)}
                            halo={false}
                          />
                          <StatusBadge variant={statusBadge(d.status)}>
                            {d.statusLabel}
                          </StatusBadge>
                        </span>
                      </td>
                      <td className={styles.td}>
                        {d.heartbeat ? (
                          <span className={styles.statusCell}>
                            <StatusDot
                              variant={heartbeatDot(d.heartbeat.status)}
                              halo={false}
                            />
                            <span className={styles.mono}>
                              {formatBattery(d.heartbeat.batteryLevel)} ·{" "}
                              {d.heartbeat.networkType ?? "—"}
                            </span>
                          </span>
                        ) : (
                          <span className={styles.mono}>—</span>
                        )}
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
            aria-label={`Device ${selected.id}`}
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
              <div className={styles.sectionTitle}>Role &amp; binding</div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Role</dt>
                  <dd className={styles.detailValue}>
                    {selected.roleLabel ?? "—"}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Binding</dt>
                  <dd className={styles.detailValue}>
                    {selected.binding
                      ? `${selected.binding.anchorLabel} (${selected.binding.type})`
                      : "—"}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Anchor ID</dt>
                  <dd
                    className={`${styles.detailValue} ${styles.detailValueMono}`}
                  >
                    {selected.binding?.anchorId ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Capability policy</div>
              {selected.policy ? (
                <>
                  <dl className={styles.detailsList}>
                    <div className={styles.detailRow}>
                      <dt className={styles.detailLabel}>policyVersion</dt>
                      <dd
                        className={`${styles.detailValue} ${styles.detailValueMono}`}
                      >
                        v{selected.policy.policyVersion}
                      </dd>
                    </div>
                  </dl>
                  <div
                    className={styles.sectionTitle}
                    style={{ marginTop: 12 }}
                  >
                    disabledCapabilities
                  </div>
                  {selected.policy.disabledCapabilities.length === 0 ? (
                    <p className={styles.policyReason}>
                      None — device has full role-default access.
                    </p>
                  ) : (
                    <ul className={styles.capabilityList}>
                      {selected.policy.disabledCapabilities.map((cap) => (
                        <li key={cap} className={styles.capabilityRow}>
                          <span className={styles.capabilityLabel}>
                            {capabilityLabel(cap)}
                          </span>
                          <span className={styles.capabilityCode}>
                            {cap}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {selected.policy.policyReason ? (
                    <p className={styles.policyReason}>
                      <strong>policyReason:</strong>{" "}
                      {selected.policy.policyReason}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className={styles.policyReason}>
                  Capability policy is set on the transition{" "}
                  <code>pending → active</code> by the operator.
                </p>
              )}
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Heartbeat</div>
              {selected.heartbeat ? (
                <dl className={styles.detailsList}>
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Last seen</dt>
                    <dd className={styles.detailValue}>
                      {selected.heartbeat.lastSeenAt}
                    </dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Status</dt>
                    <dd className={styles.detailValue}>
                      <span className={styles.statusCell}>
                        <StatusDot
                          variant={heartbeatDot(selected.heartbeat.status)}
                          halo={false}
                        />
                        {selected.heartbeat.status}
                      </span>
                    </dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Battery</dt>
                    <dd className={styles.detailValue}>
                      {formatBattery(selected.heartbeat.batteryLevel)}
                      {selected.heartbeat.batteryCharging
                        ? " · charging"
                        : ""}
                    </dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Network</dt>
                    <dd className={styles.detailValue}>
                      {selected.heartbeat.networkType ?? "—"}
                    </dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>App version</dt>
                    <dd
                      className={`${styles.detailValue} ${styles.detailValueMono}`}
                    >
                      {selected.platform.appVersion}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className={styles.policyReason}>
                  No heartbeat received yet.
                </p>
              )}
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Platform</div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Manufacturer</dt>
                  <dd className={styles.detailValue}>
                    {selected.platform.manufacturer}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Model</dt>
                  <dd className={styles.detailValue}>
                    {selected.platform.model}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>OS</dt>
                  <dd className={styles.detailValue}>
                    {selected.platform.osVersion}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailActions}>
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={isRetired}
                title={
                  isRetired
                    ? "Retired devices cannot be reassigned."
                    : "Assign role + binding for this device."
                }
                onClick={() => setAssignDialogOpen(true)}
              >
                Assign
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={isPending || isRetired}
                title={
                  isPending
                    ? "Capability policy is set once the device transitions pending → active."
                    : isRetired
                      ? "Capability policy is read-only for retired devices."
                      : "Open the mock-first capability policy editor for this device."
                }
                onClick={() => setPolicyEditorOpen(true)}
              >
                Edit policy
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={isRetired}
                title={
                  isRetired
                    ? "Device is already retired."
                    : "Retire this device (terminal lifecycle transition)."
                }
                onClick={() => setRetireDialogOpen(true)}
              >
                Retire
              </Button>
            </div>
          </aside>
        ) : null}
      </div>

      <AndroidDevicePolicyEditor
        open={policyEditorOpen}
        device={selected ?? null}
        now={policyEditorNow}
        onSave={(deviceId, nextPolicy) => {
          state.applyPolicyEdit(deviceId, nextPolicy);
        }}
        onClose={() => setPolicyEditorOpen(false)}
      />

      <AndroidDeviceAssignDialog
        open={assignDialogOpen}
        device={selected ?? null}
        onSubmit={(deviceId, assignment) => {
          state.assignDevice(deviceId, assignment);
        }}
        onClose={() => setAssignDialogOpen(false)}
      />

      <AndroidDeviceRetireDialog
        open={retireDialogOpen}
        device={selected ?? null}
        onSubmit={(deviceId, request) => {
          state.retireDevice(deviceId, request);
        }}
        onClose={() => setRetireDialogOpen(false)}
      />
    </section>
  );
}
