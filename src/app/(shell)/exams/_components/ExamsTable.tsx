import { StatusBadge, type StatusBadgeVariant, Table } from "@/components";
import type { ExamItem } from "./defaultExamsLoader";
import type { ExamStatus } from "./useExamsData";
import styles from "./ExamsTable.module.css";

type Props = {
  exams: ExamItem[];
  selectedId?: string;
  onSelect: (exam: ExamItem) => void;
};

function statusVariant(status: ExamStatus): StatusBadgeVariant {
  switch (status) {
    case "inProgress":
      return "info";
    case "finished":
      return "success";
    case "aborted":
      return "danger";
    case "scheduled":
    default:
      return "neutral";
  }
}

function shortId(value: string): string {
  return value.length <= 8 ? value : `${value.slice(0, 8)}…`;
}

export function ExamsTable({ exams, selectedId, onSelect }: Props) {
  return (
    <Table caption="Exams (mock data; list endpoint not in MVP API)">
      <thead>
        <tr>
          <th scope="col">Exam</th>
          <th scope="col">Candidate</th>
          <th scope="col">Vehicle</th>
          <th scope="col">Type</th>
          <th scope="col">Status</th>
          <th scope="col">Scheduled</th>
        </tr>
      </thead>
      <tbody>
        {exams.map((exam) => {
          const isSelected = exam.examId === selectedId;
          return (
            <tr
              key={exam.examId}
              className={
                isSelected
                  ? `${styles.row} ${styles.rowActive}`
                  : styles.row
              }
              onClick={() => onSelect(exam)}
              aria-selected={isSelected}
            >
              <td>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(exam);
                  }}
                  className={styles.idButton}
                >
                  {shortId(exam.examId)}
                </button>
              </td>
              <td className={styles.mono}>
                {shortId(exam.candidateRef.candidateId)}
              </td>
              <td className={styles.mono}>
                {shortId(exam.vehicleRef.vehicleId)}
              </td>
              <td className={styles.mono}>{exam.examType}</td>
              <td>
                <StatusBadge variant={statusVariant(exam.status)}>
                  {exam.status}
                </StatusBadge>
              </td>
              <td className={styles.mono}>{exam.scheduledAt}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
