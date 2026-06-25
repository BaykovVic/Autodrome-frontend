"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";
import type { components } from "@/contracts/types/android-device-management";
import { consoleAndroidDevicesFor } from "./consoleAndroidDevicesFixtures";
import {
  liveAndroidDeviceApplyPolicy,
  liveAndroidDeviceAssign,
  liveAndroidDeviceRetire,
  liveAndroidDevicesLoader,
  mapAndroidDeviceBindingDtoToConsole,
} from "./liveAndroidDevicesLoader";
import type {
  ConsoleAndroidDevice,
  ConsoleAndroidDeviceCapabilityPolicy,
  ConsoleAndroidDevicesSnapshot,
} from "./consoleAndroidDevicesSnapshot";

type AndroidDeviceAssignmentDto =
  components["schemas"]["AndroidDeviceAssignment"];
type AndroidDeviceRetireRequestDto =
  components["schemas"]["AndroidDeviceRetireRequest"];

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
  /**
   * Dispatch an assignment for the target device.
   *
   * Mock mode: immutable snapshot update — sets status to
   * `active`, applies role + binding + optional notes from the
   * canonical body, stamps `assignedAt` from the supplied `now`.
   * If the device had no `policy` yet (pending → active first
   * assignment) a default empty policy with `policyVersion = 1`
   * is created so the detail aside still shows a policy section.
   *
   * Live mode: dispatches
   * `POST /admin/devices/{deviceId}/assign` and replaces the
   * snapshot device with the backend-stamped response. On
   * failure surfaces `ApiError` through `setFatalError` (incl.
   * `503 ANDROID_DEVICE_NOT_IMPLEMENTED` backend-lag).
   */
  assignDevice: (
    deviceId: string,
    assignment: AndroidDeviceAssignmentDto,
  ) => void;
  /**
   * Dispatch a retire for the target device.
   *
   * Mock mode: immutable snapshot update — sets status to
   * `retired` and stamps `retiredAt` from the supplied `now`.
   * Heartbeat status снижается до `offline` для honest UI.
   *
   * Live mode: dispatches
   * `POST /admin/devices/{deviceId}/retire` and replaces the
   * snapshot device with the backend-stamped response. On
   * failure surfaces `ApiError` through `setFatalError`.
   */
  retireDevice: (
    deviceId: string,
    request: AndroidDeviceRetireRequestDto,
  ) => void;
};

export type ConsoleAndroidDevicesHookOptions = {
  loader?: ConsoleAndroidDevicesLoader;
  /**
   * Stable "now" timestamp used by mock-mode mutations
   * (assignedAt / retiredAt). Production code passes the screen
   * prop default; tests inject a deterministic value.
   */
  now?: string;
};

const DEFAULT_NOW_FALLBACK = "2026-06-24T00:00:00Z";

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
  loaderOrOptions?:
    | ConsoleAndroidDevicesLoader
    | ConsoleAndroidDevicesHookOptions,
): ConsoleAndroidDevicesState {
  // Back-compat: callers pass either a bare loader function or
  // the structured options object.
  const options: ConsoleAndroidDevicesHookOptions =
    typeof loaderOrOptions === "function"
      ? { loader: loaderOrOptions }
      : (loaderOrOptions ?? {});
  const loader = options.loader;
  const now = options.now ?? DEFAULT_NOW_FALLBACK;
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

  const assignDevice = useCallback(
    (deviceId: string, assignment: AndroidDeviceAssignmentDto) => {
      if (resolveRuntimeMode() !== "live") {
        // Mock branch: client-side immutable update reflecting
        // the post-assignment state. The capability policy update
        // path is kept separate (use the policy editor); this
        // mutation only shifts role + binding + status.
        setSnapshot((prev) => {
          if (!prev) return prev;
          const devices = prev.devices.map((d) => {
            if (d.id !== deviceId) return d;
            const becameActive = d.status !== "active";
            const policy =
              d.policy ??
              (becameActive
                ? {
                    policyVersion: 1,
                    disabledCapabilities: [],
                  }
                : undefined);
            return {
              ...d,
              status: "active" as const,
              statusLabel: "active",
              role: assignment.role,
              roleLabel: assignment.role,
              binding: mapAndroidDeviceBindingDtoToConsole(
                assignment.binding,
              ),
              ...(policy ? { policy } : {}),
              ...(becameActive ? { assignedAt: now } : {}),
            };
          });
          const pending = devices.filter((d) => d.status === "pending")
            .length;
          const active = devices.filter((d) => d.status === "active")
            .length;
          const retired = devices.filter((d) => d.status === "retired")
            .length;
          return {
            ...prev,
            totals: {
              devices: devices.length,
              pending,
              active,
              retired,
            },
            devices,
          };
        });
        return;
      }

      // Live mode: dispatch POST /admin/devices/{deviceId}/assign.
      void (async () => {
        try {
          const adapter = getApiAdapter({ mode: "live" });
          const updated = await liveAndroidDeviceAssign(
            adapter,
            deviceId,
            assignment,
          );
          setSnapshot((prev) => {
            if (!prev) return prev;
            const devices = prev.devices.map((d) =>
              d.id === deviceId ? updated : d,
            );
            return {
              ...prev,
              totals: {
                devices: devices.length,
                pending: devices.filter((d) => d.status === "pending")
                  .length,
                active: devices.filter((d) => d.status === "active")
                  .length,
                retired: devices.filter((d) => d.status === "retired")
                  .length,
              },
              devices,
            };
          });
        } catch (error) {
          // 503 ANDROID_DEVICE_NOT_IMPLEMENTED while backend lag
          // persists — surface degraded state through the
          // standard fatal-error path.
          setFatalError(error);
        }
      })();
    },
    [now],
  );

  const retireDevice = useCallback(
    (deviceId: string, request: AndroidDeviceRetireRequestDto) => {
      if (resolveRuntimeMode() !== "live") {
        setSnapshot((prev) => {
          if (!prev) return prev;
          const devices = prev.devices.map((d) => {
            if (d.id !== deviceId) return d;
            return {
              ...d,
              status: "retired" as const,
              statusLabel: "retired",
              retiredAt: now,
              // Honest heartbeat status — retired devices stop
              // sending heartbeats per canonical contract.
              ...(d.heartbeat
                ? {
                    heartbeat: {
                      ...d.heartbeat,
                      status: "offline" as const,
                    },
                  }
                : {}),
            };
          });
          return {
            ...prev,
            totals: {
              devices: devices.length,
              pending: devices.filter((d) => d.status === "pending")
                .length,
              active: devices.filter((d) => d.status === "active").length,
              retired: devices.filter((d) => d.status === "retired")
                .length,
            },
            devices,
          };
        });
        // The retire body is ignored in mock mode — the operator
        // audit reason carries no observable effect on the local
        // snapshot. Live mode forwards it via the live command.
        void request;
        return;
      }

      void (async () => {
        try {
          const adapter = getApiAdapter({ mode: "live" });
          const updated = await liveAndroidDeviceRetire(
            adapter,
            deviceId,
            request,
          );
          setSnapshot((prev) => {
            if (!prev) return prev;
            const devices = prev.devices.map((d) =>
              d.id === deviceId ? updated : d,
            );
            return {
              ...prev,
              totals: {
                devices: devices.length,
                pending: devices.filter((d) => d.status === "pending")
                  .length,
                active: devices.filter((d) => d.status === "active")
                  .length,
                retired: devices.filter((d) => d.status === "retired")
                  .length,
              },
              devices,
            };
          });
        } catch (error) {
          setFatalError(error);
        }
      })();
    },
    [now],
  );

  return {
    loading,
    snapshot,
    fatalError,
    reload,
    applyPolicyEdit,
    assignDevice,
    retireDevice,
  };
}
