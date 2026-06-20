"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/api/errors";
import {
  defaultRecordingsLoader,
  type RecordingItem,
} from "./defaultRecordingsLoader";

export type RecordingsLoader = () =>
  | RecordingItem[]
  | Promise<RecordingItem[]>;

export type RecordingsState = {
  loading: boolean;
  recordings: RecordingItem[];
  fatalError: unknown | null;
  degraded: boolean;
  reload: () => void;
};

const EMPTY: RecordingItem[] = [];

export function useRecordingsData(
  loader?: RecordingsLoader,
): RecordingsState {
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<RecordingItem[]>(EMPTY);
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
        const value = await (loader ? loader() : defaultRecordingsLoader());
        if (cancelled) return;
        setRecordings(value ?? EMPTY);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status >= 500) {
          setDegraded(true);
          setRecordings(EMPTY);
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

  return { loading, recordings, fatalError, degraded, reload };
}
