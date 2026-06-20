import { describe, expect, it } from "vitest";

import {
  applyExerciseFilters,
  DEFAULT_FILTERS,
} from "@/app/(shell)/exercises/_components/applyExerciseFilters";
import type { Exercise } from "@/app/(shell)/exercises/_components/useExercisesData";

const PARKING: Exercise = {
  exerciseId: "ex-1",
  code: "EX-PARK-01",
  title: "Parallel parking",
  status: "published",
  createdAt: "2026-06-19T10:00:00Z",
};

const HILL: Exercise = {
  exerciseId: "ex-2",
  code: "EX-HILL-01",
  title: "Hill start",
  description: "Start on incline",
  status: "draft",
  createdAt: "2026-06-19T10:00:00Z",
};

const ALL = [PARKING, HILL];

describe("applyExerciseFilters", () => {
  it("returns all by default", () => {
    expect(applyExerciseFilters(ALL, DEFAULT_FILTERS)).toEqual(ALL);
  });

  it("filters by status", () => {
    expect(
      applyExerciseFilters(ALL, {
        ...DEFAULT_FILTERS,
        status: "draft",
      }),
    ).toEqual([HILL]);
  });

  it("filters by code substring", () => {
    expect(
      applyExerciseFilters(ALL, {
        ...DEFAULT_FILTERS,
        code: "park",
      }),
    ).toEqual([PARKING]);
  });

  it("filters by description through search", () => {
    expect(
      applyExerciseFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "incline",
      }),
    ).toEqual([HILL]);
  });

  it("combines code and status", () => {
    expect(
      applyExerciseFilters(ALL, {
        ...DEFAULT_FILTERS,
        code: "park",
        status: "draft",
      }),
    ).toEqual([]);
  });
});
