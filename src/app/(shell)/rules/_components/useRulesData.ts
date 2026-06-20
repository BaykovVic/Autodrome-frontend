"use client";

import { useCallback, useEffect, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { components } from "@/contracts/types/violation-rule";

export type RuleDefinition = components["schemas"]["RuleDefinition"];
export type RuleStatus = RuleDefinition["status"];

export type RulesState = {
  loading: boolean;
  rules: RuleDefinition[];
  fatalError: unknown | null;
  degraded: boolean;
  reload: () => void;
};

const EMPTY: RuleDefinition[] = [];

export function useRulesData(api: AutodromeApi): RulesState {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<RuleDefinition[]>(EMPTY);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError(null);
      setDegraded(false);
      try {
        const response = await api.violationRule.GET("/rules", {
          params: { query: { pageSize: 200 } },
        });
        if (cancelled) return;
        const items = (response.data?.items ?? []) as RuleDefinition[];
        setRules(items);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status >= 500) {
          setDegraded(true);
          setRules(EMPTY);
          setLoading(false);
          return;
        }
        setFatalError(error);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [api, tick]);

  return { loading, rules, fatalError, degraded, reload };
}
