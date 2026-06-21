"use client";

import { useCallback, useEffect, useState } from "react";

import { defaultConsoleDashboardLoader } from "./defaultConsoleDashboardLoader";
import type { ConsoleDashboardSnapshot } from "./consoleDashboardSnapshot";

export type ConsoleDashboardLoader = () =>
  | ConsoleDashboardSnapshot
  | Promise<ConsoleDashboardSnapshot>;

export type ConsoleDashboardState = {
  loading: boolean;
  snapshot: ConsoleDashboardSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

export function useConsoleDashboard(
  loader?: ConsoleDashboardLoader,
): ConsoleDashboardState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleDashboardSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError(null);
      try {
        const value = await (loader
          ? loader()
          : defaultConsoleDashboardLoader());
        if (cancelled) return;
        setSnapshot(value);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        setFatalError(error);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [loader, tick]);

  return { loading, snapshot, fatalError, reload };
}
