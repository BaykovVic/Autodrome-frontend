"use client";

import { useEffect, useMemo, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { getApiAdapter } from "@/api/get-api-adapter";
import {
  ApiErrorView,
  Button,
  DegradedState,
  EmptyState,
  Skeleton,
} from "@/components";
import {
  DEFAULT_FILTERS,
  applyViolationFilters,
  type ViolationFilterState,
} from "./applyViolationFilters";
import { ViolationCreateForm } from "./ViolationCreateForm";
import { ViolationDetail } from "./ViolationDetail";
import { ViolationFilters } from "./ViolationFilters";
import { ViolationsTable } from "./ViolationsTable";
import { useViolationsData, type Violation } from "./useViolationsData";
import styles from "./ViolationWorkspace.module.css";

type Props = {
  api?: AutodromeApi;
};

export function ViolationWorkspace({ api }: Props) {
  const resolvedApi = useMemo(() => api ?? getApiAdapter(), [api]);
  const state = useViolationsData(resolvedApi);

  const [filters, setFilters] = useState<ViolationFilterState>(
    DEFAULT_FILTERS,
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );
  const [createOpen, setCreateOpen] = useState(false);

  // Local in-memory mirror so newly-created violations appear without
  // a full reload. Codex review note from exam workspace: prefer
  // `useEffect` over a `useMemo` side-effect; the ESLint
  // `react-hooks/set-state-in-effect` rule is silenced explicitly.
  const [violations, setViolations] = useState<Violation[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mirror cache
    setViolations(state.violations);
  }, [state.violations]);

  const visible = useMemo(
    () => applyViolationFilters(violations, filters),
    [violations, filters],
  );

  const selected: Violation | undefined = useMemo(
    () =>
      violations.find((v) => v.violationId === selectedId) ?? undefined,
    [violations, selectedId],
  );

  return (
    <section
      className={styles.workspace}
      aria-label="Violation workspace"
    >
      <header className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Violations</h1>
          <p className={styles.subtitle}>
            Catalog through
            <span className={styles.mono}>
              {' api.violationRule.GET("/violations")'}
            </span>
            . Create via typed POST. Rule editor / rule evaluation are
            out of scope here.
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={state.reload}>
            Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Create violation
          </Button>
        </div>
      </header>

      {state.degraded ? (
        <DegradedState
          service="violation-rule-service · violations"
          onRetry={state.reload}
        />
      ) : null}

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      <ViolationFilters
        value={filters}
        onChange={setFilters}
        totalCount={violations.length}
        matchedCount={visible.length}
      />

      <div className={styles.body}>
        <div className={styles.listColumn}>
          {state.loading ? (
            <Skeleton lines={6} label="Loading violations" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No violations"
              description={
                violations.length === 0
                  ? "No violations in this scenario."
                  : "No violations match current filters."
              }
            />
          ) : (
            <ViolationsTable
              violations={visible}
              selectedId={selectedId}
              onSelect={(v) => setSelectedId(v.violationId)}
            />
          )}
        </div>
        {selected ? (
          <ViolationDetail
            violation={selected}
            onClose={() => setSelectedId(undefined)}
          />
        ) : null}
      </div>

      <ViolationCreateForm
        api={resolvedApi}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(violation) =>
          // Prepend created violation so the workspace shows it
          // immediately without a refetch.
          setViolations((prev) => [violation as Violation, ...prev])
        }
      />
    </section>
  );
}
