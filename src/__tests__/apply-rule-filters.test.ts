import { describe, expect, it } from "vitest";

import {
  applyRuleFilters,
  DEFAULT_FILTERS,
} from "@/app/(shell)/rules/_components/applyRuleFilters";
import type { RuleDefinition } from "@/app/(shell)/rules/_components/useRulesData";

const STOP_LINE: RuleDefinition = {
  ruleId: "60000000-0000-4000-8000-000000000001",
  violationRef: {
    violationId: "50000000-0000-4000-8000-000000000001",
  },
  title: "Stop line — published baseline",
  ruleVersion: 2,
  status: "published",
  createdAt: "2026-06-19T10:00:00Z",
};

const SPEED_LIMIT: RuleDefinition = {
  ruleId: "60000000-0000-4000-8000-000000000002",
  violationRef: {
    violationId: "50000000-0000-4000-8000-000000000002",
  },
  title: "Speed limit — published baseline",
  description: "Caps configured per exam type",
  ruleVersion: 1,
  status: "published",
  createdAt: "2026-06-19T10:00:00Z",
};

const SEATBELT_DRAFT: RuleDefinition = {
  ruleId: "60000000-0000-4000-8000-000000000003",
  violationRef: {
    violationId: "50000000-0000-4000-8000-000000000003",
  },
  title: "Seatbelt — draft",
  ruleVersion: 1,
  status: "draft",
  createdAt: "2026-06-19T10:00:00Z",
};

const ALL = [STOP_LINE, SPEED_LIMIT, SEATBELT_DRAFT];

describe("applyRuleFilters", () => {
  it("returns all by default", () => {
    expect(applyRuleFilters(ALL, DEFAULT_FILTERS)).toEqual(ALL);
  });

  it("filters by status", () => {
    expect(
      applyRuleFilters(ALL, {
        ...DEFAULT_FILTERS,
        status: "draft",
      }),
    ).toEqual([SEATBELT_DRAFT]);
  });

  it("filters by title substring", () => {
    expect(
      applyRuleFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "stop",
      }),
    ).toEqual([STOP_LINE]);
  });

  it("filters by description substring", () => {
    expect(
      applyRuleFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "caps",
      }),
    ).toEqual([SPEED_LIMIT]);
  });

  it("filters by ruleId substring", () => {
    expect(
      applyRuleFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "00000003",
      }),
    ).toEqual([SEATBELT_DRAFT]);
  });

  it("filters by violationId substring", () => {
    expect(
      applyRuleFilters(ALL, {
        ...DEFAULT_FILTERS,
        violationId: "00000002",
      }),
    ).toEqual([SPEED_LIMIT]);
  });

  it("combines search and status", () => {
    expect(
      applyRuleFilters(ALL, {
        search: "stop",
        status: "draft",
        violationId: "",
      }),
    ).toEqual([]);
  });
});
