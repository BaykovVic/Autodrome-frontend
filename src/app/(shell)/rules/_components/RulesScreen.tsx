"use client";

import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  EmptyState,
  PlusIcon,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  useConsoleRules,
  type ConsoleRulesLoader,
} from "./useConsoleRules";
import type {
  ConsoleRule,
  ConsoleRuleStatus,
} from "./consoleRulesSnapshot";
import styles from "./RulesScreen.module.css";

type Props = {
  loader?: ConsoleRulesLoader;
};

function statusDot(status: ConsoleRuleStatus): StatusDotVariant {
  switch (status) {
    case "published":
      return "online";
    case "draft":
      return "standby";
    case "archived":
    default:
      return "offline";
  }
}

function statusBadge(status: ConsoleRuleStatus): StatusBadgeVariant {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "neutral";
    case "archived":
    default:
      return "danger";
  }
}

export function RulesScreen({ loader }: Props) {
  const state = useConsoleRules(loader);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const rules = useMemo(
    () => state.snapshot?.rules ?? [],
    [state.snapshot],
  );

  const selected: ConsoleRule | undefined = useMemo(() => {
    if (selectedId) {
      const match = rules.find((r) => r.id === selectedId);
      if (match) return match;
    }
    return rules[0];
  }, [rules, selectedId]);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Rules">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading rules" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Rules">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.screen} aria-label="Rules">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Rules</h1>
          <p className={styles.subtitle}>
            Scoring rule sets · draft &amp; published versions
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled
          title="Create-rule flow lands in a follow-up feature."
        >
          <PlusIcon />
          New rule
        </Button>
      </header>

      <div className={styles.body}>
        <div className={styles.tableColumn}>
          {rules.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                title="No rules"
                description="No rules in this scenario."
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>Rule</th>
                  <th scope="col" className={styles.th}>Ver</th>
                  <th scope="col" className={styles.th}>Status</th>
                  <th
                    scope="col"
                    className={`${styles.th} ${styles.thRight}`}
                  >
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => {
                  const isSelected = r.id === selected?.id;
                  return (
                    <tr
                      key={r.id}
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
                          className={styles.ruleBtn}
                          onClick={() => setSelectedId(r.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          <span className={styles.ruleName}>{r.name}</span>
                          <span className={styles.ruleId}>{r.id}</span>
                        </button>
                      </td>
                      <td className={`${styles.td} ${styles.mono}`}>
                        {r.version}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot
                            variant={statusDot(r.status)}
                            halo={false}
                          />
                          <StatusBadge variant={statusBadge(r.status)}>
                            {r.statusLabel}
                          </StatusBadge>
                        </span>
                      </td>
                      <td
                        className={`${styles.td} ${styles.tdRight} ${styles.monoSmall}`}
                      >
                        {r.updated}
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
            aria-label={`Rule ${selected.id}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderText}>
                <div className={styles.detailMeta}>
                  {selected.id} · {selected.version}
                </div>
                <div className={styles.detailName}>{selected.name}</div>
              </div>
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

            <div className={styles.detailSection}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>Condition tree</span>
                <span className={styles.plannedTag}>EDITOR · PLANNED</span>
              </div>
              <pre className={styles.conditionPreview}>
                {selected.conditionPreview.join("\n")}
              </pre>
              <p className={styles.conditionNote}>
                Read-only preview. Visual condition tree editor ships in a
                later milestone.
              </p>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>Version history</span>
              </div>
              <div className={styles.historyList}>
                {selected.history.map((h, i) => {
                  const isCurrent = i === 0;
                  return (
                    <div key={h.id} className={styles.historyRow}>
                      <span
                        className={
                          isCurrent
                            ? styles.historyVersion
                            : `${styles.historyVersion} ${styles.historyVersionMuted}`
                        }
                      >
                        {h.version} · {h.stateLabel}
                      </span>
                      <span className={styles.historyDate}>{h.updated}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.actionRow}>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  disabled
                  title="Publish version lands with the rules publish integration feature."
                >
                  Publish version
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled
                  title="Save draft lands with the rules edit integration feature."
                >
                  Save draft
                </Button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
