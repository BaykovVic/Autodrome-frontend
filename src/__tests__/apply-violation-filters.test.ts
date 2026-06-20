import { describe, expect, it } from "vitest";

import {
  applyViolationFilters,
  DEFAULT_FILTERS,
} from "@/app/(shell)/violations/_components/applyViolationFilters";
import type { Violation } from "@/app/(shell)/violations/_components/useViolationsData";

const STOP_LINE: Violation = {
  violationId: "v-1",
  code: "STOP_LINE_CROSSED",
  title: "Stop line crossed",
  severity: "medium",
  createdAt: "2026-06-19T10:00:00Z",
};

const SEATBELT: Violation = {
  violationId: "v-2",
  code: "SEATBELT_MISSING",
  title: "Seatbelt not fastened",
  severity: "critical",
  description: "Driver had no seatbelt",
  createdAt: "2026-06-19T10:00:00Z",
};

const ALL = [STOP_LINE, SEATBELT];

describe("applyViolationFilters", () => {
  it("returns all by default", () => {
    expect(applyViolationFilters(ALL, DEFAULT_FILTERS)).toEqual(ALL);
  });

  it("filters by severity", () => {
    expect(
      applyViolationFilters(ALL, {
        ...DEFAULT_FILTERS,
        severity: "critical",
      }),
    ).toEqual([SEATBELT]);
  });

  it("filters by code substring", () => {
    expect(
      applyViolationFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "stop",
      }),
    ).toEqual([STOP_LINE]);
  });

  it("filters by description substring", () => {
    expect(
      applyViolationFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "seatbelt",
      }),
    ).toEqual([SEATBELT]);
  });

  it("combines search and severity", () => {
    expect(
      applyViolationFilters(ALL, {
        search: "stop",
        severity: "critical",
      }),
    ).toEqual([]);
  });
});
