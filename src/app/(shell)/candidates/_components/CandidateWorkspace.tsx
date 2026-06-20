"use client";

import { useMemo, useState } from "react";

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
  applyCandidateFilters,
  type CandidateFilterState,
} from "./applyCandidateFilters";
import { CandidateDetail } from "./CandidateDetail";
import { CandidateFilters } from "./CandidateFilters";
import { CandidateRegisterForm } from "./CandidateRegisterForm";
import { CandidatesTable } from "./CandidatesTable";
import { useCandidatesData, type Candidate } from "./useCandidatesData";
import styles from "./CandidateWorkspace.module.css";

type Props = {
  api?: AutodromeApi;
};

export function CandidateWorkspace({ api }: Props) {
  const resolvedApi = useMemo(() => api ?? getApiAdapter(), [api]);
  const state = useCandidatesData(resolvedApi);

  const [filters, setFilters] = useState<CandidateFilterState>(
    DEFAULT_FILTERS,
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );
  const [registerOpen, setRegisterOpen] = useState(false);

  const visible = useMemo(
    () => applyCandidateFilters(state.candidates, filters),
    [state.candidates, filters],
  );

  const selected: Candidate | undefined = useMemo(
    () =>
      state.candidates.find((c) => c.candidateId === selectedId) ??
      undefined,
    [state.candidates, selectedId],
  );

  return (
    <section
      className={styles.workspace}
      aria-label="Candidate workspace"
    >
      <header className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Candidates</h1>
          <p className={styles.subtitle}>
            Registry list with filters, detail and registration. Data via
            <span className={styles.mono}> getApiAdapter()</span>.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={state.reload}
          >
            Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRegisterOpen(true)}
          >
            Register candidate
          </Button>
        </div>
      </header>

      {state.degraded ? (
        <DegradedState
          service="candidate-service"
          onRetry={state.reload}
          description="Showing nothing while the service is degraded."
        />
      ) : null}

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      <CandidateFilters
        value={filters}
        onChange={setFilters}
        totalCount={state.candidates.length}
        matchedCount={visible.length}
      />

      <div className={styles.body}>
        <div className={styles.listColumn}>
          {state.loading ? (
            <Skeleton lines={6} label="Loading candidates" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No candidates"
              description={
                state.candidates.length === 0
                  ? "No candidates in this scenario."
                  : "No candidates match current filters."
              }
            />
          ) : (
            <CandidatesTable
              candidates={visible}
              selectedId={selectedId}
              onSelect={(candidate) => setSelectedId(candidate.candidateId)}
            />
          )}
        </div>
        {selected ? (
          <CandidateDetail
            candidate={selected}
            onClose={() => setSelectedId(undefined)}
          />
        ) : null}
      </div>

      <CandidateRegisterForm
        api={resolvedApi}
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => state.reload()}
      />
    </section>
  );
}
