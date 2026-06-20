import { StatusBadge, type StatusBadgeVariant, Table } from "@/components";
import type { Exercise, ExerciseStatus } from "./useExercisesData";
import styles from "./ExercisesTable.module.css";

type Props = {
  exercises: Exercise[];
  selectedId?: string;
  onSelect: (exercise: Exercise) => void;
};

function statusVariant(status: ExerciseStatus): StatusBadgeVariant {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "info";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

export function ExercisesTable({
  exercises,
  selectedId,
  onSelect,
}: Props) {
  return (
    <Table caption="Exercises catalog (mock data)">
      <thead>
        <tr>
          <th scope="col">Code</th>
          <th scope="col">Title</th>
          <th scope="col">Status</th>
          <th scope="col">Version</th>
        </tr>
      </thead>
      <tbody>
        {exercises.map((exercise) => {
          const isSelected = exercise.exerciseId === selectedId;
          return (
            <tr
              key={exercise.exerciseId}
              className={
                isSelected
                  ? `${styles.row} ${styles.rowActive}`
                  : styles.row
              }
              onClick={() => onSelect(exercise)}
              aria-selected={isSelected}
            >
              <td>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(exercise);
                  }}
                  className={styles.codeButton}
                >
                  {exercise.code}
                </button>
              </td>
              <td>{exercise.title}</td>
              <td>
                <StatusBadge variant={statusVariant(exercise.status)}>
                  {exercise.status}
                </StatusBadge>
              </td>
              <td className={styles.mono}>
                {exercise.currentVersion
                  ? `v${exercise.currentVersion.versionNumber}`
                  : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
