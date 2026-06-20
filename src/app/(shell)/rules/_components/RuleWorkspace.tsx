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
  applyRuleFilters,
  type RuleFilterState,
} from "./applyRuleFilters";
import { RuleDetail } from "./RuleDetail";
import { RuleDraftCreateForm } from "./RuleDraftCreateForm";
import { RuleFilters } from "./RuleFilters";
import { RulesTable } from "./RulesTable";
import { useRulesData, type RuleDefinition } from "./useRulesData";
import styles from "./RuleWorkspace.module.css";

type Props = {
  api?: AutodromeApi;
};

export function RuleWorkspace({ api }: Props) {
  const resolvedApi = useMemo(() => api ?? getApiAdapter(), [api]);
  const state = useRulesData(resolvedApi);

  const [filters, setFilters] = useState<RuleFilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  // Local in-memory mirror so newly-created/published rules surface
  // without a refetch. Matches the pattern adopted across other
  // workspaces; ESLint rule for setState-in-effect is suppressed
  // explicitly on the mirroring line below.
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mirror cache
    setRules(state.rules);
  }, [state.rules]);

  // Spread-merge replacement (R1 exercise review lesson): even if the
  // server returned a partial object, identity fields stay intact.
  function patchRule(next: RuleDefinition) {
    setRules((prev) =>
      prev.map((row) =>
        row.ruleId === next.ruleId
          ? ({ ...row, ...next } as RuleDefinition)
          : row,
      ),
    );
  }

  const visible = useMemo(
    () => applyRuleFilters(rules, filters),
    [rules, filters],
  );

  const selected: RuleDefinition | undefined = useMemo(
    () => rules.find((r) => r.ruleId === selectedId) ?? undefined,
    [rules, selectedId],
  );

  return (
    <section className={styles.workspace} aria-label="Rule workspace">
      <header className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Rules</h1>
          <p className={styles.subtitle}>
            Review existing rules, create drafts for violations and
            publish new versions.
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
            Create rule draft
          </Button>
        </div>
      </header>

      {state.degraded ? (
        <DegradedState
          service="violation-rule-service · rules"
          onRetry={state.reload}
        />
      ) : null}

      {state.fatalError ? (
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      ) : null}

      <RuleFilters
        value={filters}
        onChange={setFilters}
        totalCount={rules.length}
        matchedCount={visible.length}
      />

      <div className={styles.body}>
        <div className={styles.listColumn}>
          {state.loading ? (
            <Skeleton lines={6} label="Loading rules" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No rules"
              description={
                rules.length === 0
                  ? "No rules in this scenario."
                  : "No rules match current filters."
              }
            />
          ) : (
            <RulesTable
              rules={visible}
              selectedId={selectedId}
              onSelect={(r) => setSelectedId(r.ruleId)}
            />
          )}
        </div>
        {selected ? (
          <RuleDetail
            api={resolvedApi}
            rule={selected}
            onClose={() => setSelectedId(undefined)}
            onUpdated={patchRule}
          />
        ) : null}
      </div>

      <RuleDraftCreateForm
        api={resolvedApi}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(rule) =>
          setRules((prev) => [rule as RuleDefinition, ...prev])
        }
      />
    </section>
  );
}
