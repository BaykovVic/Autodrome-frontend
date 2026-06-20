import { StatusBadge, type StatusBadgeVariant, Table } from "@/components";
import type { Candidate, CandidateStatus } from "./useCandidatesData";
import styles from "./CandidatesTable.module.css";

type Props = {
  candidates: Candidate[];
  selectedId?: string;
  onSelect: (candidate: Candidate) => void;
};

function statusVariant(status: CandidateStatus): StatusBadgeVariant {
  switch (status) {
    case "active":
      return "success";
    case "registered":
      return "info";
    case "suspended":
      return "warning";
    case "archived":
    case "deleted":
      return "neutral";
    default:
      return "neutral";
  }
}

function fullName(candidate: Candidate): string {
  return [
    candidate.lastName,
    candidate.firstName,
    candidate.middleName,
  ]
    .filter(Boolean)
    .join(" ");
}

export function CandidatesTable({
  candidates,
  selectedId,
  onSelect,
}: Props) {
  return (
    <Table caption="Candidates registry (mock data)">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Birth date</th>
          <th scope="col">Document</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {candidates.map((candidate) => {
          const isSelected = candidate.candidateId === selectedId;
          return (
            <tr
              key={candidate.candidateId}
              className={
                isSelected
                  ? `${styles.row} ${styles.rowActive}`
                  : styles.row
              }
              onClick={() => onSelect(candidate)}
              aria-selected={isSelected}
            >
              <td>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(candidate);
                  }}
                  className={styles.nameButton}
                >
                  {fullName(candidate)}
                </button>
              </td>
              <td className={styles.mono}>{candidate.birthDate}</td>
              <td className={styles.mono}>
                {candidate.identityDocument.documentType} ·{" "}
                {candidate.identityDocument.documentNumber}
              </td>
              <td>
                <StatusBadge variant={statusVariant(candidate.status)}>
                  {candidate.status}
                </StatusBadge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
