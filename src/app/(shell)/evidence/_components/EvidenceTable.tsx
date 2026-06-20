import {
  StatusBadge,
  type StatusBadgeVariant,
  Table,
} from "@/components";
import type { RecordingItem } from "./defaultRecordingsLoader";
import { recordingModalities } from "./applyEvidenceFilters";
import styles from "./EvidenceTable.module.css";

type Props = {
  recordings: RecordingItem[];
  selectedId?: string;
  onSelect: (record: RecordingItem) => void;
};

function statusVariant(
  status: RecordingItem["status"],
): StatusBadgeVariant {
  switch (status) {
    case "active":
      return "info";
    case "finalized":
      return "success";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function modalityVariant(modality: string): StatusBadgeVariant {
  return modality === "audio" ? "info" : "neutral";
}

function shortId(value: string): string {
  return value.length <= 8 ? value : `${value.slice(0, 8)}…`;
}

export function EvidenceTable({
  recordings,
  selectedId,
  onSelect,
}: Props) {
  return (
    <Table caption="Evidence — media recordings linked to exams">
      <thead>
        <tr>
          <th scope="col">Recording</th>
          <th scope="col">Exam</th>
          <th scope="col">Status</th>
          <th scope="col">Modalities</th>
          <th scope="col">Sources</th>
          <th scope="col">Started</th>
        </tr>
      </thead>
      <tbody>
        {recordings.map((record) => {
          const isSelected = record.recordingId === selectedId;
          const modalities = recordingModalities(record);
          return (
            <tr
              key={record.recordingId}
              className={
                isSelected
                  ? `${styles.row} ${styles.rowActive}`
                  : styles.row
              }
              onClick={() => onSelect(record)}
              aria-selected={isSelected}
            >
              <td>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(record);
                  }}
                  className={styles.idButton}
                >
                  {shortId(record.recordingId)}
                </button>
              </td>
              <td className={styles.mono}>
                {shortId(record.examRef.examId)}
              </td>
              <td>
                <StatusBadge variant={statusVariant(record.status)}>
                  {record.status}
                </StatusBadge>
              </td>
              <td>
                <span className={styles.badgeRow}>
                  {modalities.map((m) => (
                    <StatusBadge key={m} variant={modalityVariant(m)}>
                      {m}
                    </StatusBadge>
                  ))}
                </span>
              </td>
              <td className={styles.mono}>
                {(record.sources ?? []).length}
              </td>
              <td className={styles.mono}>{record.startedAt}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
