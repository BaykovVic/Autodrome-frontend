"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleVirtualVehicleRuntimePreviewFor } from "./consoleVirtualVehicleRuntimePreviewFixtures";
import { liveVirtualVehicleRuntimePreviewLoader } from "./liveVirtualVehicleRuntimePreviewLoader";
import type { ConsoleRuntimePreview } from "./consoleVirtualVehicleRuntimePreviewSnapshot";

export type ConsoleRuntimePreviewLoader = (
  sessionId: string,
) => ConsoleRuntimePreview | Promise<ConsoleRuntimePreview>;

export type ConsoleRuntimePreviewState = {
  loading: boolean;
  snapshot: ConsoleRuntimePreview | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(
  sessionId: string,
): Promise<ConsoleRuntimePreview> {
  if (resolveRuntimeMode() === "live") {
    return liveVirtualVehicleRuntimePreviewLoader(
      getApiAdapter({ mode: "live" }),
      sessionId,
    );
  }
  return consoleVirtualVehicleRuntimePreviewFor(sessionId);
}

export function useConsoleVirtualVehicleRuntimePreview(
  sessionId: string,
  loader?: ConsoleRuntimePreviewLoader,
): ConsoleRuntimePreviewState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleRuntimePreview | null>(null);
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
