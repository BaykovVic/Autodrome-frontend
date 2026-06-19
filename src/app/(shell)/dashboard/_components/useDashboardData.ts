"use client";

import { useCallback, useEffect, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import type { components as CandidateComp } from "@/contracts/types/candidate";
import type { components as VehicleComp } from "@/contracts/types/vehicle";
import type { components as ExerciseComp } from "@/contracts/types/exercise";
import type { components as ViolationRuleComp } from "@/contracts/types/violation-rule";

export type Candidate = CandidateComp["schemas"]["Candidate"];
export type Vehicle = VehicleComp["schemas"]["Vehicle"];
export type Exercise = ExerciseComp["schemas"]["Exercise"];
export type Violation = ViolationRuleComp["schemas"]["Violation"];
export type RuleDefinition =
  ViolationRuleComp["schemas"]["RuleDefinition"];

export type DashboardData = {
  candidates: Candidate[];
  vehicles: Vehicle[];
  exercises: Exercise[];
  violations: Violation[];
  rules: RuleDefinition[];
};

export type DegradedService =
  | "candidate"
  | "vehicle"
  | "exercise"
  | "violation"
  | "rule";

const EMPTY_DATA: DashboardData = {
  candidates: [],
  vehicles: [],
  exercises: [],
  violations: [],
  rules: [],
};

export type DashboardState = {
  loading: boolean;
  data: DashboardData;
  fatalError: unknown | null;
  degraded: DegradedService[];
  reload: () => void;
};

export function useDashboardData(api: AutodromeApi): DashboardState {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [fatalError, setFatalError] = useState<unknown | null>(null);
  const [degraded, setDegraded] = useState<DegradedService[]>([]);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError(null);

      const calls = await Promise.allSettled([
        api.candidate.GET("/candidates", {
          params: { query: { pageSize: 200 } },
        }),
        api.vehicle.GET("/vehicles", {
          params: { query: { pageSize: 200 } },
        }),
        api.exercise.GET("/exercises", {
          params: { query: { pageSize: 200 } },
        }),
        api.violationRule.GET("/violations", {
          params: { query: { pageSize: 200 } },
        }),
        api.violationRule.GET("/rules", {
          params: { query: { pageSize: 200 } },
        }),
      ]);

      if (cancelled) return;

      const next: DashboardData = { ...EMPTY_DATA };
      const newDegraded: DegradedService[] = [];

      const services: DegradedService[] = [
        "candidate",
        "vehicle",
        "exercise",
        "violation",
        "rule",
      ];

      calls.forEach((result, index) => {
        const service = services[index];
        if (result.status === "rejected") {
          newDegraded.push(service);
          return;
        }
        const items = (result.value.data?.items ?? []) as unknown[];
        switch (service) {
          case "candidate":
            next.candidates = items as Candidate[];
            break;
          case "vehicle":
            next.vehicles = items as Vehicle[];
            break;
          case "exercise":
            next.exercises = items as Exercise[];
            break;
          case "violation":
            next.violations = items as Violation[];
            break;
          case "rule":
            next.rules = items as RuleDefinition[];
            break;
        }
      });

      setData(next);
      setDegraded(newDegraded);
      setLoading(false);
    }

    load().catch((error) => {
      if (cancelled) return;
      setFatalError(error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [api, tick]);

  return { loading, data, fatalError, degraded, reload };
}
