"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";

import { consoleAuditFor } from "./consoleAuditFixtures";
import {
  liveAuditEventsLoader,
  liveAuditExport,
  liveAuditVerify,
} from "./liveAuditLoader";
import type {
  ConsoleAuditExport,
  ConsoleAuditExportFormat,
  ConsoleAuditSnapshot,
  ConsoleAuditVerification,
} from "./consoleAuditSnapshot";

export type ConsoleAuditLoader = () =>
  | ConsoleAuditSnapshot
  | Promise<ConsoleAuditSnapshot>;

export type ConsoleAuditState = {
  loading: boolean;
  snapshot: ConsoleAuditSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
  runVerify: () => Promise<void>;
  dispatchExport: (format: ConsoleAuditExportFormat) => Promise<void>;
  /** Pending operation marker: "verify" / "export" / null. */
  pendingOperation: "verify" | "export" | null;
};

async function defaultLoader(): Promise<ConsoleAuditSnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveAuditEventsLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleAuditFor(scenario);
}

export function useConsoleAudit(
  loader?: ConsoleAuditLoader,
): ConsoleAuditState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleAuditSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);
  const [pendingOperation, setPendingOperation] = useState<
    "verify" | "export" | null
  >(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError(null);
      try {
        const value = await (loader ? loader() : defaultLoader());
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

  const runVerify = useCallback(async () => {
    if (resolveRuntimeMode() !== "live") {
      // Mock fallback: synthesize a passed verification
      // marker without backend call.
      setSnapshot((prev) => {
        if (!prev) return prev;
        const mock: ConsoleAuditVerification = {
          runId: "mock-verify-" + Date.now().toString(36),
          status: "passed",
          statusLabel: "Passed (mock)",
          checkedBlocks: prev.events.length,
          ranAt: new Date().toISOString(),
        };
        return { ...prev, lastVerification: mock };
      });
      return;
    }
    setPendingOperation("verify");
    try {
      const verification = await liveAuditVerify(
        getApiAdapter({ mode: "live" }),
      );
      setSnapshot((prev) =>
        prev ? { ...prev, lastVerification: verification } : prev,
      );
    } catch (error) {
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              degradedNote:
                error instanceof Error
                  ? error.message
                  : "Verification failed.",
            }
          : prev,
      );
    } finally {
      setPendingOperation(null);
    }
  }, []);

  const dispatchExport = useCallback(
    async (format: ConsoleAuditExportFormat) => {
      if (resolveRuntimeMode() !== "live") {
        // Mock fallback.
        setSnapshot((prev) => {
          if (!prev) return prev;
          const mock: ConsoleAuditExport = {
            exportId: "mock-export-" + Date.now().toString(36),
            format,
            formatLabel: format.toUpperCase() + " (mock)",
            eventCount: prev.events.length,
            createdAt: new Date().toISOString(),
          };
          return { ...prev, lastExport: mock };
        });
        return;
      }
      setPendingOperation("export");
      try {
        const exportResult = await liveAuditExport(
          getApiAdapter({ mode: "live" }),
          { format },
        );
        setSnapshot((prev) =>
          prev ? { ...prev, lastExport: exportResult } : prev,
        );
      } catch (error) {
        setSnapshot((prev) =>
          prev
            ? {
                ...prev,
                degradedNote:
                  error instanceof Error
                    ? error.message
                    : "Export failed.",
              }
            : prev,
        );
      } finally {
        setPendingOperation(null);
      }
    },
    [],
  );

  return {
    loading,
    snapshot,
    fatalError,
    reload,
    runVerify,
    dispatchExport,
    pendingOperation,
  };
}
