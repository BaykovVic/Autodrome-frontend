import { describe, expect, it } from "vitest";

import {
  applyExamFilters,
  DEFAULT_FILTERS,
} from "@/app/(shell)/exams/_components/applyExamFilters";
import type { ExamItem } from "@/app/(shell)/exams/_components/defaultExamsLoader";

const SCHEDULED: ExamItem = {
  examId: "ex-1",
  candidateRef: { candidateId: "cand-anna" },
  vehicleRef: { vehicleId: "veh-renault" },
  examType: "autodromeBasic",
  status: "scheduled",
  scheduledAt: "2026-06-19T12:00:00Z",
  createdAt: "2026-06-19T10:00:00Z",
};

const IN_PROGRESS: ExamItem = {
  examId: "ex-2",
  candidateRef: { candidateId: "cand-boris" },
  vehicleRef: { vehicleId: "veh-lada" },
  examType: "retest",
  status: "inProgress",
  scheduledAt: "2026-06-19T13:00:00Z",
  startedAt: "2026-06-19T13:05:00Z",
  createdAt: "2026-06-19T10:00:00Z",
};

const ALL = [SCHEDULED, IN_PROGRESS];

describe("applyExamFilters", () => {
  it("returns all exams by default", () => {
    expect(applyExamFilters(ALL, DEFAULT_FILTERS)).toEqual(ALL);
  });

  it("filters by status", () => {
    expect(
      applyExamFilters(ALL, {
        ...DEFAULT_FILTERS,
        status: "inProgress",
      }),
    ).toEqual([IN_PROGRESS]);
  });

  it("filters by exam type", () => {
    expect(
      applyExamFilters(ALL, {
        ...DEFAULT_FILTERS,
        examType: "retest",
      }),
    ).toEqual([IN_PROGRESS]);
  });

  it("filters by candidate id substring", () => {
    expect(
      applyExamFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "anna",
      }),
    ).toEqual([SCHEDULED]);
  });

  it("combines search and status", () => {
    expect(
      applyExamFilters(ALL, {
        search: "boris",
        status: "scheduled",
        examType: "any",
      }),
    ).toEqual([]);
  });
});
