"use client";

import { useCallback, useEffect, useState } from "react";

import { consoleVirtualVehicleManualControlFor } from "./consoleVirtualVehicleManualControlFixtures";
import type { ConsoleManualControlPanel } from "./consoleVirtualVehicleManualControlSnapshot";

export type ConsoleManualControlLoader = (
  sessionId: string,
) => ConsoleManualControlPanel | Promise<ConsoleManualControlPanel>;

export type ConsoleManualControlState = {
  loading: boolean;
  snapshot: ConsoleManualControlPanel | null;
  fatalError: unknown | null;
  reload: () => void;
};

function defaultLoader(sessionId: string): ConsoleManualControlPanel {
  return consoleVirtualVehicleManualControlFor(sessionId);
}

export function useConsoleVirtualVehicleManualControl(
  sessionId: string,
  loader?: ConsoleManualControlLoader,
): ConsoleManualControlState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleManualControlPanel | null>(null);
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
