"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";

import { centralSyncFor } from "./consoleCentralSyncFixtures";
import {
  liveCentralSyncExport,
  liveCentralSyncLoader,
  liveCentralSyncRun,
} from "./liveCentralSyncLoader";
import type {
  ConsoleCentralSyncSnapshot,
  ConsolePackageType,
  ConsoleSyncScopeItem,
} from "./consoleCentralSyncSnapshot";

export type ConsoleCentralSyncState = {
  loading: boolean;
  snapshot: ConsoleCentralSyncSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
  runSync: (scope: ConsoleSyncScopeItem[]) => Promise<void>;
  exportPackage: (type: ConsolePackageType) => Promise<void>;
  pendingOperation: "sync" | "export" | null;
};

async function defaultLoader(): Promise<ConsoleCentralSyncSnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveCentralSyncLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return centralSyncFor(scenario);
}

export function useConsoleCentralSync(): ConsoleCentralSyncState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleCentralSyncSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);
  const [pendingOperation, setPendingOperation] = useState<
    "sync" | "export" | null
  >(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFatalError(null);
      try {
        const value = await defaultLoader();
        if (cancelled) return;
        setSnapshot(value);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        setFatalError(error);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const runSync = useCallback(
    async (scope: ConsoleSyncScopeItem[]) => {
      if (resolveRuntimeMode() !== "live") {
        setSnapshot((prev) =>
          prev
            ? {
                ...prev,
                lastSyncJob: {
                  jobId: "mock-sync-" + Date.now().toString(36),
                  status: "pending",
                  statusLabel: "Pending (mock)",
                  scope,
                  pendingItems: prev.status.pendingItems,
                  startedAt: new Date().toISOString(),
                },
              }
            : prev,
        );
        return;
      }
      setPendingOperation("sync");
      try {
        const job = await liveCentralSyncRun(
          getApiAdapter({ mode: "live" }),
          { scope },
        );
        setSnapshot((prev) =>
          prev ? { ...prev, lastSyncJob: job } : prev,
        );
      } catch (error) {
        setSnapshot((prev) =>
          prev
            ? {
                ...prev,
                degradedNote:
                  error instanceof Error
                    ? error.message
                    : "Sync run failed; central may be unreachable.",
              }
            : prev,
        );
      } finally {
        setPendingOperation(null);
      }
    },
    [],
  );

  const exportPackage = useCallback(async (type: ConsolePackageType) => {
    if (resolveRuntimeMode() !== "live") {
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              recentPackages: [
                {
                  packageId: "mock-pkg-" + Date.now().toString(36),
                  type,
                  typeLabel: type + " (mock)",
                  schemaVersion: 1,
                  checksumShort: "mock…hash",
                  createdAt: new Date().toISOString(),
                },
                ...prev.recentPackages,
              ],
            }
          : prev,
      );
      return;
    }
    setPendingOperation("export");
    try {
      const pkg = await liveCentralSyncExport(
        getApiAdapter({ mode: "live" }),
        { type, dryRun: false },
      );
      setSnapshot((prev) =>
        prev
          ? { ...prev, recentPackages: [pkg, ...prev.recentPackages] }
          : prev,
      );
    } catch (error) {
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              degradedNote:
                error instanceof Error
                  ? error.message
                  : "Export package failed.",
            }
          : prev,
      );
    } finally {
      setPendingOperation(null);
    }
  }, []);

  return {
    loading,
    snapshot,
    fatalError,
    reload,
    runSync,
    exportPackage,
    pendingOperation,
  };
}
