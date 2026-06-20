"use client";

import { useCallback, useEffect, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { components } from "@/contracts/types/violation-rule";

export type Violation = components["schemas"]["Violation"];
export type Severity = Violation["severity"];

export type ViolationsState = {
  loading: boolean;
  violations: Violation[];
  fatalError: unknown | null;
  degraded: boolean;
  reload: () => void;
};

const EMPTY: Violation[] = [];

export function useViolationsData(api: AutodromeApi): ViolationsState {
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState<Violation[]>(EMPTY);
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
        const response = await api.violationRule.GET("/violations", {
          params: { query: { pageSize: 200 } },
        });
        if (cancelled) return;
        const items = (response.data?.items ?? []) as Violation[];
        setViolations(items);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status >= 500) {
          setDegraded(true);
          setViolations(EMPTY);
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

  return { loading, violations, fatalError, degraded, reload };
}
