"use client";

import { useMemo, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { getApiAdapter } from "@/api/get-api-adapter";
import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
} from "@/components";
import {
  DEFAULT_FILTERS,
  applyExamFilters,
  type ExamFilterState,
} from "./applyExamFilters";
import { ExamCreateForm } from "./ExamCreateForm";
import { ExamDetail } from "./ExamDetail";
import { ExamFilters } from "./ExamFilters";
import { ExamsTable } from "./ExamsTable";
import { useExamsData, type ExamsLoader } from "./useExamsData";
import type { ExamItem } from "./defaultExamsLoader";
import styles from "./ExamWorkspace.module.css";

type Props = {
  api?: AutodromeApi;
  loader?: ExamsLoader;
};

export function ExamWorkspace({ api, loader }: Props) {
  const resolvedApi = useMemo(() => api ?? getApiAdapter(), [api]);
  const state = useExamsData(loader);

  const [filters, setFilters] = useState<ExamFilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [exams, setExams] = useState<ExamItem[]>([]);

  // Keep a local copy of exams so lifecycle actions can update a row in-place
  // without a full reload (mock GET /exams is fixture-backed and would revert).
  const sourceExams = state.exams;
  useMemoSync(sourceExams, setExams);

  const visible = useMemo(
    () => applyExamFilters(exams, filters),
    [exams, filters],
  );

  const selected: ExamItem | undefined = useMemo(
    () => exams.find((e) => e.examId === selectedId) ?? undefined,
    [exams, selectedId],
  );

  function patchExam(next: Partial<ExamItem> & { examId: string }) {
    setExams((prev) =>
      prev.map((row) =>
        row.examId === next.examId ? ({ ...row, ...next } as ExamItem) : row,
      ),
    );
  }

  return (
    <section className={styles.workspace} aria-label="Exam workspace">
      <header className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Exams</h1>
          <p className={styles.subtitle}>
            Operator workspace. List is fixture-backed because
            <span className={styles.mono}> GET /exams</span> is not in the
            MVP API. Lifecycle actions use typed
            <span className={styles.mono}> api.exam.POST</span>.
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
            Create exam
          </Button>
        </div>
      </header>

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      <ExamFilters
        value={filters}
        onChange={setFilters}
        totalCount={exams.length}
        matchedCount={visible.length}
      />

      <div className={styles.body}>
        <div className={styles.listColumn}>
          {state.loading ? (
            <Skeleton lines={6} label="Loading exams" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No exams"
              description={
                exams.length === 0
                  ? "No exams in this scenario."
                  : "No exams match current filters."
              }
            />
          ) : (
            <ExamsTable
              exams={visible}
              selectedId={selectedId}
              onSelect={(exam) => setSelectedId(exam.examId)}
            />
          )}
        </div>
        {selected ? (
          <ExamDetail
            api={resolvedApi}
            exam={selected}
            onClose={() => setSelectedId(undefined)}
            onUpdated={(next) => patchExam(next)}
          />
        ) : null}
      </div>

      <ExamCreateForm
        api={resolvedApi}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(exam) => {
          // Add the newly-created exam to the local in-memory list so the
          // operator sees it immediately even without a backend list endpoint.
          setExams((prev) => [exam as ExamItem, ...prev]);
        }}
      />
    </section>
  );
}

// Sync source exams (from loader) into local mutable state on identity change
// without dropping in-place lifecycle patches. Implemented as a tiny memo hook
// so the effect runs synchronously on render.
function useMemoSync(source: ExamItem[], setLocal: (next: ExamItem[]) => void) {
  useMemo(() => {
    setLocal(source);
  }, [source, setLocal]);
}
