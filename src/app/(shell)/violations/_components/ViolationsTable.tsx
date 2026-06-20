import { StatusBadge, type StatusBadgeVariant, Table } from "@/components";
import type { Severity, Violation } from "./useViolationsData";
import styles from "./ViolationsTable.module.css";

type Props = {
  violations: Violation[];
  selectedId?: string;
  onSelect: (violation: Violation) => void;
};

function severityVariant(severity: Severity): StatusBadgeVariant {
  switch (severity) {
    case "critical":
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "neutral";
    default:
      return "neutral";
  }
}

export function ViolationsTable({
  violations,
  selectedId,
  onSelect,
}: Props) {
  return (
    <Table caption="Violations catalog (mock data)">
      <thead>
        <tr>
          <th scope="col">Code</th>
          <th scope="col">Title</th>
          <th scope="col">Severity</th>
          <th scope="col">Created</th>
        </tr>
      </thead>
      <tbody>
        {violations.map((violation) => {
          const isSelected = violation.violationId === selectedId;
          return (
            <tr
              key={violation.violationId}
              className={
                isSelected
                  ? `${styles.row} ${styles.rowActive}`
                  : styles.row
              }
              onClick={() => onSelect(violation)}
              aria-selected={isSelected}
            >
              <td>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(violation);
                  }}
                  className={styles.codeButton}
                >
                  {violation.code}
                </button>
              </td>
              <td>{violation.title}</td>
              <td>
                <StatusBadge variant={severityVariant(violation.severity)}>
                  {violation.severity}
                </StatusBadge>
              </td>
              <td className={styles.mono}>{violation.createdAt}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
