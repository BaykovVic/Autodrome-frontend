import { describe, expect, it } from "vitest";

import {
  applyCandidateFilters,
  DEFAULT_FILTERS,
} from "@/app/(shell)/candidates/_components/applyCandidateFilters";
import type { Candidate } from "@/app/(shell)/candidates/_components/useCandidatesData";

const ANNA: Candidate = {
  candidateId: "1",
  firstName: "Anna",
  lastName: "Petrova",
  birthDate: "2002-04-12",
  identityDocument: {
    documentType: "idCard",
    documentNumber: "MK4422119",
  },
  status: "active",
  createdAt: "2026-06-19T10:00:00Z",
};

const BORIS: Candidate = {
  candidateId: "2",
  firstName: "Boris",
  lastName: "Ivanov",
  birthDate: "1999-11-30",
  identityDocument: {
    documentType: "drivingLicense",
    documentNumber: "DL7790314",
  },
  status: "registered",
  createdAt: "2026-06-19T10:00:00Z",
};

const ALL = [ANNA, BORIS];

describe("applyCandidateFilters", () => {
  it("returns all candidates when filters are default", () => {
    expect(applyCandidateFilters(ALL, DEFAULT_FILTERS)).toEqual(ALL);
  });

  it("filters by name substring", () => {
    expect(
      applyCandidateFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "petr",
      }),
    ).toEqual([ANNA]);
  });

  it("filters by document number substring", () => {
    expect(
      applyCandidateFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "dl779",
      }),
    ).toEqual([BORIS]);
  });

  it("filters by status", () => {
    expect(
      applyCandidateFilters(ALL, {
        ...DEFAULT_FILTERS,
        status: "registered",
      }),
    ).toEqual([BORIS]);
  });

  it("combines search and status", () => {
    expect(
      applyCandidateFilters(ALL, {
        search: "ivan",
        status: "active",
      }),
    ).toEqual([]);
  });
});
