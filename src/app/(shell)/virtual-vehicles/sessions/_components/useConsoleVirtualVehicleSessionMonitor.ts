"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleVirtualVehicleSessionMonitorFor } from "./consoleVirtualVehicleSessionMonitorFixtures";
import { liveVirtualVehicleSessionMonitorLoader } from "./liveVirtualVehicleSessionMonitorLoader";
import type { ConsoleVirtualVehicleSessionMonitor } from "./consoleVirtualVehicleSessionMonitorSnapshot";

export type ConsoleVirtualVehicleSessionMonitorLoader = (
  sessionId: string,
) =>
  | ConsoleVirtualVehicleSessionMonitor
  | Promise<ConsoleVirtualVehicleSessionMonitor>;

export type ConsoleVirtualVehicleSessionMonitorState = {
  loading: boolean;
  snapshot: ConsoleVirtualVehicleSessionMonitor | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(
  sessionId: string,
): Promise<ConsoleVirtualVehicleSessionMonitor> {
  if (resolveRuntimeMode() === "live") {
    return liveVirtualVehicleSessionMonitorLoader(
      getApiAdapter({ mode: "live" }),
      sessionId,
    );
  }
  return consoleVirtualVehicleSessionMonitorFor(sessionId);
}

/**
 * Mock-first per-session monitor hook. Mirrors workspace hook
 * pattern (loader DI + reload + fatalError); Track 3 live API
 * integration will swap default loader к live dispatch без
 * touching screen code.
 */
export function useConsoleVirtualVehicleSessionMonitor(
  sessionId: string,
  loader?: ConsoleVirtualVehicleSessionMonitorLoader,
): ConsoleVirtualVehicleSessionMonitorState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleVirtualVehicleSessionMonitor | null>(null);
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
          ? loader(sessionId)
          : defaultLoader(sessionId));
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
  }, [sessionId, loader, tick]);

  return { loading, snapshot, fatalError, reload };
}
