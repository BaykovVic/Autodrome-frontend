"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { consoleAndroidDevicesFor } from "./consoleAndroidDevicesFixtures";
import {
  liveAndroidDeviceApplyPolicy,
  liveAndroidDevicesLoader,
} from "./liveAndroidDevicesLoader";
import type {
  ConsoleAndroidDevice,
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
   * Apply a capability-policy edit to the target device.
   *
   * Mock mode (default): immutable snapshot update — the supplied
   * `nextPolicy` (already prepared by the policy editor with a
   * locally-bumped `policyVersion`) replaces the device's
   * `policy`.
   *
   * Live mode: dispatches
   * `POST /admin/devices/{deviceId}/assign` with the device's
   * current role + binding and the new policy (operator-side
   * write shape — backend owns `policyVersion`/`updatedAt`). On
   * success replaces the snapshot device with the
   * backend-stamped result. On failure surfaces the `ApiError`
   * through the standard fatal-error path (degraded
   * `<ApiErrorView>`).
   *
   * Returns `void` so callers don't need to await; the snapshot
   * update is observed via React state.
   */
  applyPolicyEdit: (
    deviceId: string,
    nextPolicy: ConsoleAndroidDeviceCapabilityPolicy,
  ) => void;
};

async function defaultLoader(): Promise<ConsoleAndroidDevicesSnapshot> {
  // Live mode: route through the typed
  // android-device-management-service client. When the backend
  // application layer still returns 503 ANDROID_DEVICE_NOT_IMPLEMENTED
  // (per spec "real backend support may lag behind frontend
  // wiring") the shared middleware throws an `ApiError`, which
  // bubbles up to the screen and surfaces as a degraded
  // `<ApiErrorView>` instead of fake success.
  // Mock mode (default): keep using scenario fixtures so `pnpm
  // dev` and gates stay backend-free.
  if (resolveRuntimeMode() === "live") {
    return liveAndroidDevicesLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleAndroidDevicesFor(scenario);
}

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
      // Mock-mode shortcut: client-side immutable update.
      if (resolveRuntimeMode() !== "live") {
        setSnapshot((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            devices: prev.devices.map((d) =>
              d.id === deviceId ? { ...d, policy: nextPolicy } : d,
            ),
          };
        });
        return;
      }

      // Live mode: dispatch POST /admin/devices/{deviceId}/assign
      // with role + binding from the current snapshot device.
      // We read the device synchronously before launching the
      // request so we have a stable target even if the snapshot
      // changes underneath.
      let target: ConsoleAndroidDevice | undefined;
      setSnapshot((prev) => {
        if (prev) target = prev.devices.find((d) => d.id === deviceId);
        return prev;
      });

      if (!target) return;

      void (async () => {
        try {
          const adapter = getApiAdapter({ mode: "live" });
          const updated = await liveAndroidDeviceApplyPolicy(
            adapter,
            target!,
            nextPolicy,
          );
          setSnapshot((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              devices: prev.devices.map((d) =>
                d.id === deviceId ? updated : d,
              ),
            };
          });
        } catch (error) {
          // Backend rejected (incl. 503 ANDROID_DEVICE_NOT_IMPLEMENTED
          // while backend lag persists) — surface a degraded state
          // through the standard fatal-error path. The screen
          // re-renders ApiErrorView with retry; the operator can
          // re-open the editor and try again once the backend
          // ships application support.
          setFatalError(error);
        }
      })();
    },
    [],
  );

  return { loading, snapshot, fatalError, reload, applyPolicyEdit };
}
