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
  useConsoleExercises,
  type ConsoleExercisesLoader,
} from "./useConsoleExercises";
import type {
  ConsoleExercise,
  ConsoleExerciseStatus,
} from "./consoleExercisesSnapshot";
import styles from "./ExercisesScreen.module.css";

type Props = {
  loader?: ConsoleExercisesLoader;
};

const ALL_GROUPS_ID = "all";

function statusDot(status: ConsoleExerciseStatus): StatusDotVariant {
  switch (status) {
    case "published":
      return "online";
    case "draft":
      return "standby";
    case "retired":
    default:
      return "offline";
  }
}

function statusBadge(status: ConsoleExerciseStatus): StatusBadgeVariant {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "neutral";
    case "retired":
    default:
      return "danger";
  }
}

export function ExercisesScreen({ loader }: Props) {
  const state = useConsoleExercises(loader);

  const [activeGroupId, setActiveGroupId] = useState<string>(ALL_GROUPS_ID);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const groups = useMemo(
    () => state.snapshot?.groups ?? [],
    [state.snapshot],
  );
  const exercises = useMemo(
    () => state.snapshot?.exercises ?? [],
    [state.snapshot],
  );

  const visible = useMemo(() => {
    if (activeGroupId === ALL_GROUPS_ID) return exercises;
    return exercises.filter((x) => x.groupId === activeGroupId);
  }, [exercises, activeGroupId]);

  const selected: ConsoleExercise | undefined = useMemo(() => {
    if (selectedId) {
      const match = exercises.find((x) => x.id === selectedId);
      if (match) return match;
    }
    return visible[0] ?? exercises[0];
  }, [exercises, visible, selectedId]);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Exercises">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading exercises" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Exercises">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const totalGroups = state.snapshot?.totals.groups ?? 0;
  const totalDrafts = state.snapshot?.totals.drafts ?? 0;

  return (
    <section className={styles.screen} aria-label="Exercises">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Exercises</h1>
          <p className={styles.subtitle}>
            {totalGroups} groups · {totalDrafts} drafts
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled
          title="Create-exercise flow lands in a follow-up feature."
        >
          New exercise
        </Button>
      </header>

      <div className={styles.body}>
        <nav
          className={styles.groupsColumn}
          aria-label="Exercise groups"
        >
          <div className={styles.groupsCaption}>Groups</div>
          <button
            type="button"
            className={
              activeGroupId === ALL_GROUPS_ID
                ? `${styles.groupBtn} ${styles.groupBtnActive}`
                : styles.groupBtn
            }
            onClick={() => {
              setActiveGroupId(ALL_GROUPS_ID);
              setSelectedId(undefined);
            }}
            aria-current={activeGroupId === ALL_GROUPS_ID ? "true" : undefined}
          >
            <span>All</span>
            <span className={styles.groupCount}>{exercises.length}</span>
          </button>
          {groups.map((g) => {
            const isActive = activeGroupId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className={
                  isActive
                    ? `${styles.groupBtn} ${styles.groupBtnActive}`
                    : styles.groupBtn
                }
                onClick={() => {
                  setActiveGroupId(g.id);
                  setSelectedId(undefined);
                }}
                aria-current={isActive ? "true" : undefined}
              >
                <span>{g.name}</span>
                <span className={styles.groupCount}>{g.count}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.tableColumn}>
          {visible.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                title="No exercises"
                description={
                  exercises.length === 0
                    ? "No exercises in this scenario."
                    : "No exercises in this group."
                }
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>Code</th>
                  <th scope="col" className={styles.th}>Exercise</th>
                  <th scope="col" className={styles.th}>Ver</th>
                  <th scope="col" className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((x) => {
                  const isSelected = x.id === selected?.id;
                  return (
                    <tr
                      key={x.id}
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
                          className={styles.codeBtn}
                          onClick={() => setSelectedId(x.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          {x.code}
                        </button>
                      </td>
                      <td className={styles.td}>{x.name}</td>
                      <td className={`${styles.td} ${styles.mono}`}>
                        {x.version}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot
                            variant={statusDot(x.status)}
                            halo={false}
                          />
                          <StatusBadge variant={statusBadge(x.status)}>
                            {x.statusLabel}
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
            aria-label={`Exercise ${selected.code}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailCode}>{selected.code}</div>
              <div className={styles.detailName}>{selected.name}</div>
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
              <div className={styles.sectionTitle}>Parameters</div>
              <dl className={styles.paramList}>
                <ParamRow label="Version" value={selected.version} mono />
                <ParamRow label="Difficulty" value={selected.difficulty} />
                <ParamRow
                  label="Max duration"
                  value={selected.maxDuration}
                  mono
                />
                <ParamRow
                  label="Linked rule"
                  value={selected.linkedRuleId}
                  mono
                />
              </dl>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.actionRow}>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  disabled
                  title="Publish flow lands with the exercise publish integration feature."
                >
                  Publish
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled
                  title="Edit draft lands with the exercise edit integration feature."
                >
                  Edit draft
                </Button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function ParamRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={styles.paramRow}>
      <dt className={styles.paramLabel}>{label}</dt>
      <dd className={mono ? styles.paramValueMono : styles.paramValue}>
        {value}
      </dd>
    </div>
  );
}
