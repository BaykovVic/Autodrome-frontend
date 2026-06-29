"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";

import type { ConsoleEdgeGatewaySnapshot } from "./consoleEdgeGateway";
import { consoleEdgeGatewayFor } from "./consoleEdgeGatewayFixtures";
import { liveEdgeGatewayLoader } from "./liveEdgeGatewayLoader";

export type ConsoleEdgeGatewayLoader = () =>
  | ConsoleEdgeGatewaySnapshot
  | Promise<ConsoleEdgeGatewaySnapshot>;

export type ConsoleEdgeGatewayState = {
  loading: boolean;
  snapshot: ConsoleEdgeGatewaySnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

function defaultLoader(): ConsoleEdgeGatewayLoader {
  return () => {
    if (resolveRuntimeMode() === "live") {
      return liveEdgeGatewayLoader(getApiAdapter({ mode: "live" }));
    }
    return consoleEdgeGatewayFor("forwarding");
  };
}

export function useConsoleEdgeGateway(
  loader?: ConsoleEdgeGatewayLoader,
): ConsoleEdgeGatewayState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleEdgeGatewaySnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const effective = loader ?? defaultLoader();
    async function load() {
      setLoading(true);
      setFatalError(null);
      try {
        const value = await effective();
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
