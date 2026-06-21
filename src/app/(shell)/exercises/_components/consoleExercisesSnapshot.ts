/**
 * Console-shaped exercises snapshot.
 *
 * Backend Exercise contract has exerciseId/groupId/version/status.
 * The visual surface adds design-only blocks (difficulty label,
 * max-duration display, linked rule code, publish CTA) which live in
 * the snapshot until backend ships a richer read model.
 */
export type ConsoleExerciseStatus = "published" | "draft" | "retired";

export type ConsoleExerciseGroup = {
  id: string;
  name: string;
  count: number;
};

export type ConsoleExercise = {
  id: string;
  code: string;
  name: string;
  groupId: string;
  version: string;
  difficulty: string;
  maxDuration: string;
  linkedRuleId: string;
  status: ConsoleExerciseStatus;
  statusLabel: string;
};

export type ConsoleExercisesSnapshot = {
  totals: {
    groups: number;
    exercises: number;
    drafts: number;
  };
  groups: ConsoleExerciseGroup[];
  exercises: ConsoleExercise[];
};
