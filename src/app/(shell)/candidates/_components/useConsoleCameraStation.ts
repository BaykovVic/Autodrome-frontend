"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  CameraStationScenario,
  CameraStationSnapshot,
} from "./consoleCameraStation";
import {
  consoleCameraStationFor,
  isCameraStationScenario,
} from "./consoleCameraStationFixtures";

export type ConsoleCameraStationLoader = () =>
  | CameraStationSnapshot
  | Promise<CameraStationSnapshot>;

export type ConsoleCameraStationState = {
  loading: boolean;
  snapshot: CameraStationSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
};

const DEFAULT_SCENARIO: CameraStationScenario = "capturing";

function defaultLoader(): CameraStationSnapshot {
  const env = process.env.NEXT_PUBLIC_CAMERA_STATION_SCENARIO;
  const scenario: CameraStationScenario = isCameraStationScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleCameraStationFor(scenario);
}

export function useConsoleCameraStation(
  loader?: ConsoleCameraStationLoader,
): ConsoleCameraStationState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<CameraStationSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

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

  return { loading, snapshot, fatalError, reload };
}
