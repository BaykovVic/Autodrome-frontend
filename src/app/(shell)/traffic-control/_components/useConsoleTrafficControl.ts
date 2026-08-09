"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import { resolveRuntimeMode } from "@/api/runtime-config";

import { consoleTrafficFor } from "./consoleTrafficFixtures";
import type {
  ConsoleCommandAccepted,
  ConsoleCommandType,
  ConsoleTrafficSnapshot,
} from "./consoleTrafficSnapshot";
import {
  liveTrafficCommandSender,
  liveTrafficLoader,
  type TrafficCommandSender,
} from "./liveTrafficControl";

export type ConsoleTrafficLoader = () =>
  | ConsoleTrafficSnapshot
  | Promise<ConsoleTrafficSnapshot>;

export type ConsoleTrafficState = {
  loading: boolean;
  snapshot: ConsoleTrafficSnapshot | null;
  fatalError: unknown | null;
  /** Error from the last command attempt (separate from the read). */
  commandError: unknown | null;
  reload: () => void;
  /** Dispatch a command; the accepted result comes from the backend. */
  sendCommand: (
    controllerId: string,
    commandType: ConsoleCommandType,
  ) => Promise<void>;
  clearCommandError: () => void;
};

async function defaultLoader(): Promise<ConsoleTrafficSnapshot> {
  if (resolveRuntimeMode() === "live") {
    return liveTrafficLoader(getApiAdapter({ mode: "live" }));
  }
  const env = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const scenario: MockScenario = isMockScenario(env)
    ? env
    : DEFAULT_SCENARIO;
  return consoleTrafficFor(scenario);
}

let mockCommandSeq = 0;

/**
 * Mock-mode command sender. Mock fixtures have no command endpoint, so
 * the console synthesises the acceptance locally — clearly marked as a
 * mock id. Live mode always goes through the canonical endpoint.
 */
function mockCommandSender(): TrafficCommandSender {
  return async (controllerId, commandType) => ({
    commandId: `mock-cmd-${++mockCommandSeq}`,
    controllerId,
    commandType,
    acceptedAt: new Date().toISOString(),
  });
}

function defaultSender(): TrafficCommandSender {
  return resolveRuntimeMode() === "live"
    ? liveTrafficCommandSender(getApiAdapter({ mode: "live" }))
    : mockCommandSender();
}

/**
 * Mock-first traffic-control hook. Reading state and dispatching
 * commands are separate concerns: `sendCommand` records only what the
 * backend accepted (no optimistic state), and a rejected command
 * surfaces through `commandError` for the shared taxonomy.
 */
export function useConsoleTrafficControl(
  loader?: ConsoleTrafficLoader,
  sender?: TrafficCommandSender,
): ConsoleTrafficState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleTrafficSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [commandError, setCommandError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const clearCommandError = useCallback(() => setCommandError(null), []);

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

  const sendCommand = useCallback(
    async (controllerId: string, commandType: ConsoleCommandType) => {
      setCommandError(null);
      try {
        const send = sender ?? defaultSender();
        const accepted: ConsoleCommandAccepted = await send(
          controllerId,
          commandType,
        );
        // Backend-confirmed acceptance only — never assumed.
        setSnapshot((prev) =>
          prev
            ? { ...prev, recentCommands: [accepted, ...prev.recentCommands] }
            : prev,
        );
      } catch (error) {
        setCommandError(error);
      }
    },
    [sender],
  );

  return {
    loading,
    snapshot,
    fatalError,
    commandError,
    reload,
    sendCommand,
    clearCommandError,
  };
}
