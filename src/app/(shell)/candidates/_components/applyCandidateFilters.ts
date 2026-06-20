import type { Candidate, CandidateStatus } from "./useCandidatesData";

export type CandidateFilterState = {
  search: string;
  status: CandidateStatus | "any";
};

export const DEFAULT_FILTERS: CandidateFilterState = {
  search: "",
  status: "any",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function applyCandidateFilters(
  candidates: Candidate[],
  filters: CandidateFilterState,
): Candidate[] {
  const needle = normalize(filters.search);
  return candidates.filter((candidate) => {
    if (filters.status !== "any" && candidate.status !== filters.status) {
      return false;
    }
    if (needle.length === 0) return true;
    const haystack = normalize(
      [
        candidate.firstName,
        candidate.lastName,
        candidate.middleName ?? "",
        candidate.identityDocument.documentNumber,
      ].join(" "),
    );
    return haystack.includes(needle);
  });
}
