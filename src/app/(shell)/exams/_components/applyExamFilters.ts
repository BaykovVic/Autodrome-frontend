import type { ExamItem } from "./defaultExamsLoader";
import type { ExamStatus, ExamType } from "./useExamsData";

export type ExamFilterState = {
  search: string;
  status: ExamStatus | "any";
  examType: ExamType | "any";
};

export const DEFAULT_FILTERS: ExamFilterState = {
  search: "",
  status: "any",
  examType: "any",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function applyExamFilters(
  exams: ExamItem[],
  filters: ExamFilterState,
): ExamItem[] {
  const needle = normalize(filters.search);
  return exams.filter((exam) => {
    if (filters.status !== "any" && exam.status !== filters.status) {
      return false;
    }
    if (
      filters.examType !== "any" &&
      exam.examType !== filters.examType
    ) {
      return false;
    }
    if (needle.length === 0) return true;
    const haystack = normalize(
      [
        exam.examId,
        exam.candidateRef.candidateId,
        exam.vehicleRef.vehicleId,
      ].join(" "),
    );
    return haystack.includes(needle);
  });
}
