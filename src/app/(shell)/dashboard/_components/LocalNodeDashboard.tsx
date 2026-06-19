"use client";

import { useMemo } from "react";

import {
  ApiErrorView,
  DegradedState,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components";
import type { AutodromeApi } from "@/api/adapter";
import { getApiAdapter } from "@/api/get-api-adapter";
import { SummaryCard } from "./SummaryCard";
import {
  type Candidate,
  type Exercise,
  type RuleDefinition,
  type Vehicle,
  type Violation,
  useDashboardData,
} from "./useDashboardData";
import styles from "./LocalNodeDashboard.module.css";

type Props = {
  /** Optional adapter for tests / SSR. Defaults to `getApiAdapter()`. */
  api?: AutodromeApi;
  /** Display label for the local node identity. */
  nodeId?: string;
};

const SERVICE_LABELS: Record<string, string> = {
  candidate: "candidate-service",
  vehicle: "vehicle-service",
  exercise: "exercise-service",
  violation: "violation-rule-service · violations",
  rule: "violation-rule-service · rules",
};

function countBy<T, K extends string>(
  items: T[],
  key: (item: T) => K | undefined,
): Record<K, number> {
  return items.reduce(
    (acc, item) => {
      const k = key(item);
      if (k === undefined) return acc;
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<K, number>,
  );
}

function severityVariant(severity: Violation["severity"]): StatusBadgeVariant {
  switch (severity) {
    case "critical":
    case "high":
      return "danger";
    case "medium":
      return "warning";
    default:
      return "neutral";
  }
}

export function LocalNodeDashboard({
  api,
  nodeId = "node-local",
}: Props) {
  const resolvedApi = useMemo(() => api ?? getApiAdapter(), [api]);
  const state = useDashboardData(resolvedApi);

  if (state.loading) {
    return (
      <section
        className={styles.dashboard}
        aria-label="Local node dashboard"
      >
        <header className={styles.topRow}>
          <h1 className={styles.title}>Local node</h1>
          <StatusBadge variant="neutral">loading</StatusBadge>
        </header>
        <Skeleton lines={6} label="Loading local node dashboard" />
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.dashboard}>
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      </section>
    );
  }

  return (
    <section
      className={styles.dashboard}
      aria-label="Local node dashboard"
    >
      <DashboardHeader
        nodeId={nodeId}
        degraded={state.degraded.length}
        onReload={state.reload}
      />

      {state.degraded.length > 0 ? (
        <div className={styles.degradedStack}>
          {state.degraded.map((service) => (
            <DegradedState
              key={service}
              service={SERVICE_LABELS[service] ?? service}
              onRetry={state.reload}
            />
          ))}
        </div>
      ) : null}

      <div className={styles.grid}>
        <ServicesCard degraded={state.degraded} />
        <ExamsCard />
        <VehiclesCard vehicles={state.data.vehicles} />
        <CandidatesCard candidates={state.data.candidates} />
        <ViolationsCard violations={state.data.violations} />
        <ExercisesAndRulesCard
          exercises={state.data.exercises}
          rules={state.data.rules}
        />
        <MediaArchiveCard />
        <OfflineCard />
      </div>
    </section>
  );
}

function DashboardHeader({
  nodeId,
  degraded,
  onReload,
}: {
  nodeId: string;
  degraded: number;
  onReload: () => void;
}) {
  return (
    <header className={styles.topRow}>
      <div className={styles.titleColumn}>
        <h1 className={styles.title}>Local node</h1>
        <p className={styles.subtitle}>
          {nodeId} · offline-first · mock data only
        </p>
      </div>
      <div className={styles.headerActions}>
        {degraded === 0 ? (
          <StatusBadge variant="success">all services ok</StatusBadge>
        ) : (
          <StatusBadge variant="warning">{degraded} degraded</StatusBadge>
        )}
        <button
          type="button"
          className={styles.reload}
          onClick={onReload}
          aria-label="Reload dashboard"
        >
          Reload
        </button>
      </div>
    </header>
  );
}

function ServicesCard({ degraded }: { degraded: string[] }) {
  const services = [
    { id: "candidate", label: "candidate-service" },
    { id: "vehicle", label: "vehicle-service" },
    { id: "exercise", label: "exercise-service" },
    { id: "violation", label: "violation-rule (violations)" },
    { id: "rule", label: "violation-rule (rules)" },
  ];
  return (
    <SummaryCard
      title="Services"
      hint="Per-service health derived from list endpoints"
    >
      <ul className={styles.servicesList}>
        {services.map((service) => {
          const isDegraded = degraded.includes(service.id);
          return (
            <li key={service.id} className={styles.serviceItem}>
              <span className={styles.serviceLabel}>{service.label}</span>
              <StatusBadge
                variant={isDegraded ? "danger" : "success"}
              >
                {isDegraded ? "degraded" : "ok"}
              </StatusBadge>
            </li>
          );
        })}
      </ul>
    </SummaryCard>
  );
}

function ExamsCard() {
  // Exam service has no list endpoint in MVP API; surface a placeholder
  // until exam workspace fetches per-exam timelines.
  return (
    <SummaryCard
      title="Exams"
      hint="Today’s exam activity"
      footer="exam-service /exams list endpoint not in MVP API"
    >
      <EmptyState
        title="No live exam feed yet"
        description="Exam summary will populate once the per-day exam read model is wired up."
      />
    </SummaryCard>
  );
}

function CandidatesCard({ candidates }: { candidates: Candidate[] }) {
  const counts = countBy(candidates, (c) => c.status);
  const total = candidates.length;

  return (
    <SummaryCard
      title="Candidates"
      hint="Registry snapshot"
      footer="status reflects current registry, not daily delta"
    >
      <div className={styles.metricRow}>
        <Metric label="Total" value={total} tone="neutral" />
        <Metric label="Active" value={counts.active ?? 0} tone="success" />
        <Metric
          label="Registered"
          value={counts.registered ?? 0}
          tone="info"
        />
        <Metric
          label="Archived"
          value={(counts.archived ?? 0) + (counts.suspended ?? 0)}
          tone="neutral"
        />
      </div>
    </SummaryCard>
  );
}

function VehiclesCard({ vehicles }: { vehicles: Vehicle[] }) {
  const counts = countBy(vehicles, (v) => v.status);
  return (
    <SummaryCard
      title="Vehicles"
      hint="Fleet availability"
      footer="status is fleet registry state"
    >
      <div className={styles.metricRow}>
        <Metric
          label="Total"
          value={vehicles.length}
          tone="neutral"
        />
        <Metric label="Active" value={counts.active ?? 0} tone="success" />
        <Metric
          label="Maintenance"
          value={counts.maintenance ?? 0}
          tone="warning"
        />
        <Metric
          label="Decommissioned"
          value={counts.decommissioned ?? 0}
          tone="neutral"
        />
      </div>
    </SummaryCard>
  );
}

function ViolationsCard({ violations }: { violations: Violation[] }) {
  const counts = countBy(violations, (v) => v.severity);
  const critical = counts.critical ?? 0;
  return (
    <SummaryCard
      title="Violations"
      hint="Catalog severity breakdown"
      footer={
        critical > 0
          ? `${critical} critical entries — review during shift handover`
          : "no critical violations registered"
      }
    >
      <div className={styles.metricRow}>
        <Metric label="Total" value={violations.length} tone="neutral" />
        {(["critical", "high", "medium", "low"] as const).map(
          (severity) => (
            <Metric
              key={severity}
              label={severity}
              value={counts[severity] ?? 0}
              tone={severityVariant(severity)}
            />
          ),
        )}
      </div>
    </SummaryCard>
  );
}

function ExercisesAndRulesCard({
  exercises,
  rules,
}: {
  exercises: Exercise[];
  rules: RuleDefinition[];
}) {
  const publishedExercises = exercises.filter(
    (e) => e.status === "published",
  ).length;
  const draftExercises = exercises.filter(
    (e) => e.status === "draft",
  ).length;
  const publishedRules = rules.filter((r) => r.status === "published").length;
  const draftRules = rules.filter((r) => r.status === "draft").length;

  return (
    <SummaryCard
      title="Configuration"
      hint="Exercises & rules"
      footer="published items are runtime-active"
    >
      <dl className={styles.configList}>
        <div className={styles.configRow}>
          <dt>Exercises published</dt>
          <dd>{publishedExercises}</dd>
        </div>
        <div className={styles.configRow}>
          <dt>Exercises draft</dt>
          <dd>{draftExercises}</dd>
        </div>
        <div className={styles.configRow}>
          <dt>Rules published</dt>
          <dd>{publishedRules}</dd>
        </div>
        <div className={styles.configRow}>
          <dt>Rules draft</dt>
          <dd>{draftRules}</dd>
        </div>
      </dl>
    </SummaryCard>
  );
}

function MediaArchiveCard() {
  return (
    <SummaryCard
      title="Media archive"
      hint="Local node storage indicator"
      footer="media-archive-service not wired up yet"
    >
      <EmptyState
        title="Storage indicator pending"
        description="Media archive contract surface will populate this card."
      />
    </SummaryCard>
  );
}

function OfflineCard() {
  return (
    <SummaryCard
      title="Offline / local"
      hint="Runtime topology"
      footer="cloud sync is optional and disabled by default"
    >
      <ul className={styles.offlineList}>
        <li>
          <StatusBadge variant="success">offline-first</StatusBadge>
          <span>Local node runs without internet</span>
        </li>
        <li>
          <StatusBadge variant="info">mock data</StatusBadge>
          <span>Dashboard reads from mock adapter fixtures</span>
        </li>
        <li>
          <StatusBadge variant="neutral">no cloud sync</StatusBadge>
          <span>Optional central sync service not connected</span>
        </li>
      </ul>
    </SummaryCard>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: StatusBadgeVariant;
}) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricValue}>{value}</div>
      <StatusBadge variant={tone}>{label}</StatusBadge>
    </div>
  );
}
