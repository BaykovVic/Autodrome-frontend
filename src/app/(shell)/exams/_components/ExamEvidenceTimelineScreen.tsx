"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ApiErrorView,
  EmptyState,
  Skeleton,
  StatusDot,
} from "@/components";

import {
  CONSOLE_EVIDENCE_SOURCES,
  EVIDENCE_SOURCE_LABELS,
  type ConsoleEvidenceSource,
  type ConsoleEvidenceTimelineEntry,
} from "./consoleExamEvidenceTimeline";
import {
  useConsoleExamEvidenceTimeline,
  type ConsoleExamEvidenceTimelineLoader,
} from "./useConsoleExamEvidenceTimeline";

import styles from "./ExamEvidenceTimelineScreen.module.css";

type Props = {
  examId: string;
  loader?: ConsoleExamEvidenceTimelineLoader;
};

type SourceFilter = "all" | ConsoleEvidenceSource;

const SOURCE_FILTERS: readonly SourceFilter[] = [
  "all",
  ...CONSOLE_EVIDENCE_SOURCES,
];

function filterLabel(f: SourceFilter): string {
  return f === "all" ? "All" : EVIDENCE_SOURCE_LABELS[f];
}

export function ExamEvidenceTimelineScreen({ examId, loader }: Props) {
  const state = useConsoleExamEvidenceTimeline(examId, loader);
  const [filter, setFilter] = useState<SourceFilter>("all");

  const entries = useMemo(
    () => state.snapshot?.entries ?? [],
    [state.snapshot],
  );
  const counts = useMemo(() => {
    const c: Record<SourceFilter, number> = {
      all: entries.length,
      lifecycle: 0,
      violation: 0,
      telemetry: 0,
      media: 0,
      biometry: 0,
      audio: 0,
      other: 0,
    };
    for (const e of entries) c[e.source] += 1;
    return c;
  }, [entries]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? entries
        : entries.filter((e) => e.source === filter),
    [entries, filter],
  );

  return (
    <section
      className={styles.screen}
      aria-label="Exam evidence timeline"
    >
      <header className={styles.header}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/exams" className={styles.crumbsLink}>
            Exams
          </Link>
          <span aria-hidden="true">›</span>
          <span className={styles.crumbsCurrent}>{examId}</span>
          <span aria-hidden="true">›</span>
          <span className={styles.crumbsCurrent}>Evidence timeline</span>
        </nav>
        <h1 className={styles.title}>Evidence timeline</h1>
        <p className={styles.subtitle}>
          Lifecycle, violations, telemetry, media, biometry and audio
          triggers for exam {examId} in one ordered view. Composed by
          exam-service; the console does not query neighbour services
          directly.
        </p>
      </header>

      <div
        className={styles.filters}
        role="group"
        aria-label="Filter by source"
      >
        {SOURCE_FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                active
                  ? `${styles.filter} ${styles.filterActive}`
                  : styles.filter
              }
              aria-pressed={active}
              aria-label={`${filterLabel(f)} (${counts[f]})`}
            >
              {filterLabel(f)} ({counts[f]})
            </button>
          );
        })}
      </div>

      <div className={styles.body}>
        {state.loading ? (
          <div className={styles.loadingPad}>
            <Skeleton lines={6} label="Loading evidence timeline" />
          </div>
        ) : state.fatalError ? (
          <div className={styles.loadingPad}>
            <ApiErrorView
              error={state.fatalError}
              onRetry={state.reload}
            />
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.emptyPad}>
            <EmptyState
              title="No evidence events"
              description={
                entries.length === 0
                  ? "exam-service has no evidence events for this exam yet."
                  : `No events for the ${filterLabel(filter)} filter.`
              }
            />
          </div>
        ) : (
          <ul
            className={styles.list}
            aria-label="Evidence timeline events"
          >
            {visible.map((entry) => (
              <EvidenceRow key={entry.key} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function EvidenceRow({ entry }: { entry: ConsoleEvidenceTimelineEntry }) {
  return (
    <li className={styles.item} aria-label={entry.sourceLabel}>
      <span className={styles.time}>{entry.occurredAt}</span>
      <StatusDot variant={entry.tone} halo={false} />
      <div>
        <div className={styles.label}>
          {entry.linkHref ? (
            <Link href={entry.linkHref} className={styles.link}>
              {entry.label}
            </Link>
          ) : (
            entry.label
          )}
        </div>
        <small className={styles.meta}>
          {entry.sourceLabel} · {entry.refKind}
          {entry.refId ? ` · ${entry.refId}` : ""}
        </small>
      </div>
      {entry.severity ? (
        <span className={styles.severity}>{entry.severity}</span>
      ) : (
        <span aria-hidden="true" />
      )}
    </li>
  );
}
