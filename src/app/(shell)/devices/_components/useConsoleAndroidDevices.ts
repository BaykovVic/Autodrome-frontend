"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { consoleAndroidDevicesFor } from "./consoleAndroidDevicesFixtures";
import type {
  ConsoleAndroidDeviceCapabilityPolicy,
  ConsoleAndroidDevicesSnapshot,
} from "./consoleAndroidDevicesSnapshot";

export type ConsoleAndroidDevicesLoader = () =>
  | ConsoleAndroidDevicesSnapshot
  | Promise<ConsoleAndroidDevicesSnapshot>;

export type ConsoleAndroidDevicesState = {
  loading: boolean;
  snapshot: ConsoleAndroidDevicesSnapshot | null;
  fatalError: unknown | null;
  reload: () => void;
  /**
   * Mock-only policy mutation. Replaces the target device's
   * `policy` with the supplied value and leaves the rest of the
   * snapshot intact. NOT a live API call — this is the local
   * mock state hook used by the policy editor baseline feature.
   *
   * Live wiring lands in
   * `feature/frontend-android-device-management-live-api-integration`
   * — at that point this method delegates to
   * `liveAndroidDeviceAssign(adapter, deviceId, { policy })` and
   * uses the backend-stamped `policyVersion` from the response
   * instead of the locally-bumped version.
   */
  applyPolicyEdit: (
    deviceId: string,
    nextPolicy: ConsoleAndroidDeviceCapabilityPolicy,
  ) => void;
};

function defaultLoader(): ConsoleAndroidDevicesSnapshot {
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleAndroidDevicesFor(scenario);
}

/**
 * Mock-first Android Devices hook. Mirrors the pattern used by
 * `useConsoleVehicles` / `useConsoleExams` before live API
 * integration shipped; live mode wiring lands in
 * `feature/frontend-android-device-management-live-api-integration`.
 */
export function useConsoleAndroidDevices(
  loader?: ConsoleAndroidDevicesLoader,
): ConsoleAndroidDevicesState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleAndroidDevicesSnapshot | null>(null);
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

  const applyPolicyEdit = useCallback(
    (deviceId: string, nextPolicy: ConsoleAndroidDeviceCapabilityPolicy) => {
      setSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          devices: prev.devices.map((d) =>
            d.id === deviceId ? { ...d, policy: nextPolicy } : d,
          ),
        };
      });
    },
    [],
  );

  return { loading, snapshot, fatalError, reload, applyPolicyEdit };
}
