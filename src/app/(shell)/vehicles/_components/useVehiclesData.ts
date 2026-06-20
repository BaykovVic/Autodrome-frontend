"use client";

import { useCallback, useEffect, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { components } from "@/contracts/types/vehicle";

export type Vehicle = components["schemas"]["Vehicle"];
export type VehicleStatus = Vehicle["status"];
export type VehicleType = Vehicle["type"];

export type VehiclesState = {
  loading: boolean;
  vehicles: Vehicle[];
  fatalError: unknown | null;
  degraded: boolean;
  reload: () => void;
};

const EMPTY: Vehicle[] = [];

export function useVehiclesData(api: AutodromeApi): VehiclesState {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>(EMPTY);
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
        const response = await api.vehicle.GET("/vehicles", {
          params: { query: { pageSize: 200 } },
        });
        if (cancelled) return;
        const items = (response.data?.items ?? []) as Vehicle[];
        setVehicles(items);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status >= 500) {
          setDegraded(true);
          setVehicles(EMPTY);
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

  return { loading, vehicles, fatalError, degraded, reload };
}
