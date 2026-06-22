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
  useConsoleExams,
  type ConsoleExamsLoader,
} from "./useConsoleExams";
import type {
  ConsoleExam,
  ConsoleExamFilter,
  ConsoleExamState,
  ConsoleExamTimelineEntry,
} from "./consoleExamsSnapshot";
import styles from "./ExamsScreen.module.css";

type Props = {
  loader?: ConsoleExamsLoader;
};

const TABS: Array<{ id: ConsoleExamFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "inProgress", label: "In progress" },
  { id: "scheduled", label: "Scheduled" },
  { id: "finished", label: "Finished" },
  { id: "aborted", label: "Aborted" },
];

function stateDot(state: ConsoleExamState): StatusDotVariant {
  switch (state) {
    case "inProgress":
      return "online";
    case "scheduled":
      return "standby";
    case "finished":
      return "online";
    case "aborted":
    default:
      return "offline";
  }
}

function stateBadge(state: ConsoleExamState): StatusBadgeVariant {
  switch (state) {
    case "inProgress":
      return "info";
    case "scheduled":
      return "neutral";
    case "finished":
      return "success";
    case "aborted":
    default:
      return "danger";
  }
}

function timelineDot(entry: ConsoleExamTimelineEntry): StatusDotVariant {
  return entry.dot;
}

export function ExamsScreen({ loader }: Props) {
  const state = useConsoleExams(loader);

  const [tab, setTab] = useState<ConsoleExamFilter>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );

  const exams = useMemo(
    () => state.snapshot?.exams ?? [],
    [state.snapshot],
  );

  const visible = useMemo(() => {
    if (tab === "all") return exams;
    return exams.filter((e) => e.state === tab);
  }, [exams, tab]);

  const selected: ConsoleExam | undefined = useMemo(() => {
    if (selectedId) {
      const match = exams.find((e) => e.id === selectedId);
      if (match) return match;
    }
    return visible[0] ?? exams[0];
  }, [exams, visible, selectedId]);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Exams">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading exams" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Exams">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.screen} aria-label="Exams">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Exams</h1>
            <p className={styles.subtitle}>
              {state.snapshot
                ? `${state.snapshot.totals.inProgress} in progress · ${state.snapshot.totals.scheduledToday} scheduled today`
                : "Loading exams…"}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled
            title="Create-exam flow lands in a follow-up feature."
          >
            <PlusIcon />
            Create exam
          </Button>
        </div>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Exam state filter"
        >
          {TABS.map((t) => {
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
                onClick={() => setTab(t.id)}
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
                title="No exams"
                description={
                  exams.length === 0
                    ? "No exams in this scenario."
                    : "No exams match this tab."
                }
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>Exam</th>
                  <th scope="col" className={styles.th}>Candidate</th>
                  <th scope="col" className={styles.th}>State</th>
                  <th
                    scope="col"
                    className={`${styles.th} ${styles.thRight}`}
                  >
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => {
                  const isSelected = e.id === selected?.id;
                  return (
                    <tr
                      key={e.id}
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
                          className={styles.examIdBtn}
                          onClick={() => setSelectedId(e.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          <span className={styles.examId}>{e.id}</span>
                          <span className={styles.examMeta}>
                            {e.route} · {e.vehicle}
                          </span>
                        </button>
                      </td>
                      <td className={styles.td}>{e.candidate}</td>
                      <td className={styles.td}>
                        <span className={styles.stateCell}>
                          <StatusDot
                            variant={stateDot(e.state)}
                            halo={false}
                          />
                          <StatusBadge variant={stateBadge(e.state)}>
                            {e.stateLabel}
                          </StatusBadge>
                        </span>
                      </td>
                      <td
                        className={`${styles.td} ${styles.tdRight} ${styles.mono}`}
                      >
                        {e.score}
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
            aria-label={`Exam ${selected.id}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderRow}>
                <span className={styles.detailId}>{selected.id}</span>
                <span className={styles.stateCell}>
                  <StatusDot
                    variant={stateDot(selected.state)}
                    halo={false}
                  />
                  <StatusBadge variant={stateBadge(selected.state)}>
                    {selected.stateLabel}
                  </StatusBadge>
                </span>
              </div>
              <dl className={styles.metaGrid}>
                <MetaCell label="Candidate" value={selected.candidate} />
                <MetaCell label="Vehicle" value={selected.vehicle} mono />
                <MetaCell label="Exercise route" value={selected.route} />
                <MetaCell
                  label="Started · duration"
                  value={`${selected.started} · ${selected.duration}`}
                  mono
                />
              </dl>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Lifecycle</div>
              <div className={styles.lifecycleRow}>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled
                  title="Start lands with the exam-lifecycle integration feature."
                >
                  Start
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  disabled
                  title="Finish lands with the exam-lifecycle integration feature."
                >
                  Finish
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  disabled
                  title="Abort lands with the exam-lifecycle integration feature."
                >
                  Abort
                </Button>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Timeline</div>
              {selected.timeline.length === 0 ? (
                <p className={styles.timelineEmpty}>
                  No events recorded yet.
                </p>
              ) : (
                <ul className={styles.timeline}>
                  {selected.timeline.map((entry) => (
                    <li key={entry.id} className={styles.timelineItem}>
                      <span
                        className={styles.timelineDot}
                        aria-hidden="true"
                      >
                        <StatusDot
                          variant={timelineDot(entry)}
                          halo={false}
                        />
                      </span>
                      <div className={styles.timelineBody}>
                        <div className={styles.timelineHeadRow}>
                          <span className={styles.timelineLabel}>
                            {entry.label}
                          </span>
                          <span className={styles.timelineTime}>
                            {entry.time}
                          </span>
                        </div>
                        <div className={styles.timelineDetail}>
                          {entry.detail}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function MetaCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={styles.metaCell}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={mono ? styles.metaValueMono : styles.metaValue}>
        {value}
      </div>
    </div>
  );
}
