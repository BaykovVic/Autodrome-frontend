import type { Exercise, ExerciseStatus } from "./useExercisesData";

export type ExerciseFilterState = {
  search: string;
  status: ExerciseStatus | "any";
  code: string;
};

export const DEFAULT_FILTERS: ExerciseFilterState = {
  search: "",
  status: "any",
  code: "",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function applyExerciseFilters(
  exercises: Exercise[],
  filters: ExerciseFilterState,
): Exercise[] {
  const needle = normalize(filters.search);
  const codeNeedle = normalize(filters.code);
  return exercises.filter((exercise) => {
    if (filters.status !== "any" && exercise.status !== filters.status) {
      return false;
    }
    if (codeNeedle && !normalize(exercise.code).includes(codeNeedle)) {
      return false;
    }
    if (needle.length === 0) return true;
    const haystack = normalize(
      [exercise.code, exercise.title, exercise.description ?? ""].join(" "),
    );
    return haystack.includes(needle);
  });
}
