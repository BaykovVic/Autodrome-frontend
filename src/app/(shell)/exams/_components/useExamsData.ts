"use client";

import { useCallback, useEffect, useState } from "react";

import { defaultExamsLoader, type ExamItem } from "./defaultExamsLoader";

export type ExamStatus = ExamItem["status"];
export type ExamType = ExamItem["examType"];

export type ExamsLoader = () =>
  | ExamItem[]
  | Promise<ExamItem[]>;

export type ExamsState = {
  loading: boolean;
  exams: ExamItem[];
  fatalError: unknown | null;
  reload: () => void;
};

const EMPTY: ExamItem[] = [];

export function useExamsData(loader?: ExamsLoader): ExamsState {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamItem[]>(EMPTY);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError(null);
      try {
        const value = await (loader ? loader() : defaultExamsLoader());
        if (cancelled) return;
        setExams(value ?? EMPTY);
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

  return { loading, exams, fatalError, reload };
}
