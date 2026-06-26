"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/api/errors";
import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";
import {
  defaultServiceHealthLoader,
} from "./defaultServiceHealthLoader";
import { liveOpsHealthLoader } from "./liveOpsHealthLoader";
import type { ServiceHealth } from "./serviceHealth";

async function pickLoaderResult(): Promise<ServiceHealth[]> {
  if (resolveRuntimeMode() === "live") {
    return liveOpsHealthLoader(getApiAdapter({ mode: "live" }));
  }
  return defaultServiceHealthLoader();
}

export type ServiceHealthLoader = () =>
  | ServiceHealth[]
  | Promise<ServiceHealth[]>;

export type ServiceHealthState = {
  loading: boolean;
  services: ServiceHealth[];
  fatalError: unknown | null;
  degraded: boolean;
  reload: () => void;
};

const EMPTY: ServiceHealth[] = [];

export function useServiceHealthData(
  loader?: ServiceHealthLoader,
): ServiceHealthState {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceHealth[]>(EMPTY);
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
        const value = await (loader ? loader() : pickLoaderResult());
        if (cancelled) return;
        setServices(value ?? EMPTY);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status >= 500) {
          setDegraded(true);
          setServices(EMPTY);
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
  }, [loader, tick]);

  return { loading, services, fatalError, degraded, reload };
}
