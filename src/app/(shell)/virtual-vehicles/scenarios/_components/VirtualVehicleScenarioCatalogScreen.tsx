"use client";

import Link from "next/link";
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
  useConsoleVirtualVehicleScenarios,
  type ConsoleVirtualVehicleScenariosLoader,
} from "./useConsoleVirtualVehicleScenarios";
import {
  SCENARIO_COORDINATE_FRAME_LABELS,
  SCENARIO_SOURCE_LABELS,
  SCENARIO_YAW_FRAME_LABELS,
  type ConsoleScenarioStatus,
  type ConsoleVirtualVehicleScenario,
} from "./consoleVirtualVehicleScenariosSnapshot";
import styles from "./VirtualVehicleScenarioCatalogScreen.module.css";

type Props = {
  loader?: ConsoleVirtualVehicleScenariosLoader;
};

type StatusFilter = ConsoleScenarioStatus | "all";

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "archived", label: "Archived" },
];

function statusDot(state: ConsoleScenarioStatus): StatusDotVariant {
  switch (state) {
    case "published":
      return "online";
    case "draft":
      return "standby";
    case "archived":
    default:
      return "offline";
  }
}

function statusBadge(
  state: ConsoleScenarioStatus,
): StatusBadgeVariant {
  switch (state) {
    case "published":
      return "success";
    case "draft":
      return "info";
    case "archived":
    default:
      return "neutral";
  }
}

export function VirtualVehicleScenarioCatalogScreen({ loader }: Props) {
  const state = useConsoleVirtualVehicleScenarios(loader);

  const [tab, setTab] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );

  const scenarios = useMemo(
    () => state.snapshot?.scenarios ?? [],
    [state.snapshot],
  );

  const visible = useMemo(() => {
    if (tab === "all") return scenarios;
    return scenarios.filter((s) => s.status === tab);
  }, [scenarios, tab]);

  const selected: ConsoleVirtualVehicleScenario | undefined = useMemo(() => {
    if (selectedId) {
      const match = scenarios.find((s) => s.id === selectedId);
      if (match) return match;
    }
    return visible[0] ?? scenarios[0];
  }, [scenarios, visible, selectedId]);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="Scenario catalog"
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading scenario catalog" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="Scenario catalog"
      >
        <div className={styles.loadingPad}>
          <ApiErrorView
            error={state.fatalError}
            onRetry={state.reload}
          />
        </div>
      </section>
    );
  }

  const totals = state.snapshot?.totals ?? {
    total: 0,
    published: 0,
    drafts: 0,
  };

  return (
    <section className={styles.screen} aria-label="Scenario catalog">
      <header className={styles.header}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/virtual-vehicles" className={styles.crumbsLink}>
            Virtual Vehicles
          </Link>
          <span aria-hidden="true">›</span>
          <span className={styles.crumbsCurrent}>Scenario catalog</span>
        </nav>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Scenario catalog</h1>
            <p className={styles.subtitle}>
              {totals.total} scenarios · {totals.published}{" "}
              published · {totals.drafts} drafts
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled
            title="Create-scenario flow lands with the upcoming virtual-vehicle live API integration feature."
          >
            New scenario
          </Button>
        </div>
        <div
          className={styles.filters}
          role="tablist"
          aria-label="Scenario status filter"
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
                title="No scenarios"
                description={
                  scenarios.length === 0
                    ? "No scenarios registered in this scenario."
                    : "No scenarios match this filter."
                }
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>
                    Scenario
                  </th>
                  <th scope="col" className={styles.th}>
                    Source
                  </th>
                  <th scope="col" className={styles.th}>
                    Frames
                  </th>
                  <th scope="col" className={styles.th}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const isSelected = s.id === selected?.id;
                  return (
                    <tr
                      key={s.id}
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
                          className={styles.scenarioBtn}
                          onClick={() => setSelectedId(s.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          <span className={styles.scenarioCode}>
                            {s.code}
                          </span>
                          <span className={styles.scenarioName}>
                            {s.name}
                          </span>
                        </button>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.sourceCell}>
                          <span className={styles.sourceLabel}>
                            {SCENARIO_SOURCE_LABELS[s.source] ?? s.source}
                          </span>
                          <span className={styles.canonicalChip}>
                            ({s.source})
                          </span>
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div>{s.yawFrameLabel} yaw</div>
                        <div className={styles.mono}>
                          {s.coordinateFrame} ·{" "}
                          {s.yawFrame}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot
                            variant={statusDot(s.status)}
                            halo={false}
                          />
                          <StatusBadge variant={statusBadge(s.status)}>
                            {s.statusLabel}
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
            aria-label={`Scenario ${selected.code}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailIdentity}>
                <span className={styles.detailCode}>{selected.code}</span>
                <span className={styles.detailName}>{selected.name}</span>
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
              <div className={styles.sectionTitle}>Description</div>
              <p className={styles.descriptionText}>
                {selected.description}
              </p>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Source</div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Source</dt>
                  <dd className={styles.detailValue}>
                    {SCENARIO_SOURCE_LABELS[selected.source] ??
                      selected.source}{" "}
                    <span className={styles.canonicalChip}>
                      ({selected.source})
                    </span>
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Version</dt>
                  <dd
                    className={`${styles.detailValue} ${styles.detailValueMono}`}
                  >
                    {selected.version}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Updated</dt>
                  <dd
                    className={`${styles.detailValue} ${styles.detailValueMono}`}
                  >
                    {selected.updatedAt}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>
                Coordinate / yaw frames
              </div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Yaw frame</dt>
                  <dd className={styles.detailValue}>
                    {SCENARIO_YAW_FRAME_LABELS[selected.yawFrame] ??
                      selected.yawFrame}{" "}
                    <span className={styles.canonicalChip}>
                      ({selected.yawFrame})
                    </span>
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Coordinate frame</dt>
                  <dd className={styles.detailValue}>
                    {SCENARIO_COORDINATE_FRAME_LABELS[
                      selected.coordinateFrame
                    ] ?? selected.coordinateFrame}{" "}
                    <span className={styles.canonicalChip}>
                      ({selected.coordinateFrame})
                    </span>
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
                title="Edit scenario flow lands with the upcoming virtual-vehicle live API integration feature."
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled
                title="Duplicate scenario flow lands with the upcoming virtual-vehicle live API integration feature."
              >
                Duplicate
              </Button>
            </div>

            <div className={styles.detailSection}>
              <p className={styles.noRawEditorNote}>
                Raw protocol editor is intentionally not exposed —
                scenario contents are operator-curated through the
                live API once shipped, never edited as raw
                trajectory payloads.
              </p>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
