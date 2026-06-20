"use client";

import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  DegradedState,
  EmptyState,
  Skeleton,
} from "@/components";
import {
  DEFAULT_FILTERS,
  applyEvidenceFilters,
  type EvidenceFilterState,
} from "./applyEvidenceFilters";
import { EvidenceDetail } from "./EvidenceDetail";
import { EvidenceFilters } from "./EvidenceFilters";
import { EvidenceTable } from "./EvidenceTable";
import type { RecordingItem } from "./defaultRecordingsLoader";
import {
  useRecordingsData,
  type RecordingsLoader,
} from "./useRecordingsData";
import styles from "./EvidenceWorkspace.module.css";

type Props = {
  loader?: RecordingsLoader;
};

export function EvidenceWorkspace({ loader }: Props) {
  const state = useRecordingsData(loader);

  const [filters, setFilters] = useState<EvidenceFilterState>(
    DEFAULT_FILTERS,
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );

  const visible = useMemo(
    () => applyEvidenceFilters(state.recordings, filters),
    [state.recordings, filters],
  );

  const selected: RecordingItem | undefined = useMemo(
    () =>
      state.recordings.find((r) => r.recordingId === selectedId) ??
      undefined,
    [state.recordings, selectedId],
  );

  return (
    <section className={styles.workspace} aria-label="Evidence workspace">
      <header className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Evidence</h1>
          <p className={styles.subtitle}>
            Media recordings linked to recent exams. Inspect status,
            sources and modalities — playback opens in a dedicated
            viewer.
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={state.reload}>
            Reload
          </Button>
        </div>
      </header>

      {state.degraded ? (
        <DegradedState
          service="media-archive-service · recordings"
          onRetry={state.reload}
        />
      ) : null}

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      <EvidenceFilters
        value={filters}
        onChange={setFilters}
        totalCount={state.recordings.length}
        matchedCount={visible.length}
      />

      <div className={styles.body}>
        <div className={styles.listColumn}>
          {state.loading ? (
            <Skeleton lines={6} label="Loading recordings" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No recordings"
              description={
                state.recordings.length === 0
                  ? "No recordings in this scenario."
                  : "No recordings match current filters."
              }
            />
          ) : (
            <EvidenceTable
              recordings={visible}
              selectedId={selectedId}
              onSelect={(r) => setSelectedId(r.recordingId)}
            />
          )}
        </div>
        {selected ? (
          <EvidenceDetail
            record={selected}
            onClose={() => setSelectedId(undefined)}
          />
        ) : null}
      </div>
    </section>
  );
}
