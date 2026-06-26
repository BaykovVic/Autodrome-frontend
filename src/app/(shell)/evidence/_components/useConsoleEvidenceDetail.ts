"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";

import { consoleEvidenceDetailFor } from "./consoleEvidenceDetailFixtures";
import { liveEvidenceDetailLoader } from "./liveEvidenceDetailLoader";
import type { ConsoleEvidenceDetail } from "./consoleEvidenceSnapshot";

export type ConsoleEvidenceDetailLoader = (
  evidenceId: string,
) => ConsoleEvidenceDetail | Promise<ConsoleEvidenceDetail>;

export type ConsoleEvidenceDetailState = {
  loading: boolean;
  snapshot: ConsoleEvidenceDetail | null;
  fatalError: unknown | null;
  reload: () => void;
};

async function defaultLoader(
  evidenceId: string,
): Promise<ConsoleEvidenceDetail> {
  if (resolveRuntimeMode() === "live") {
    return liveEvidenceDetailLoader(
      getApiAdapter({ mode: "live" }),
      evidenceId,
    );
  }
  return consoleEvidenceDetailFor(evidenceId);
}

export function useConsoleEvidenceDetail(
  evidenceId: string,
  loader?: ConsoleEvidenceDetailLoader,
): ConsoleEvidenceDetailState {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] =
    useState<ConsoleEvidenceDetail | null>(null);
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
          ? loader(evidenceId)
          : defaultLoader(evidenceId));
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
  }, [evidenceId, loader, tick]);

  return { loading, snapshot, fatalError, reload };
}
