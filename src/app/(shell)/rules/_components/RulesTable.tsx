import { StatusBadge, type StatusBadgeVariant, Table } from "@/components";
import type { RuleDefinition, RuleStatus } from "./useRulesData";
import styles from "./RulesTable.module.css";

type Props = {
  rules: RuleDefinition[];
  selectedId?: string;
  onSelect: (rule: RuleDefinition) => void;
};

function statusVariant(status: RuleStatus): StatusBadgeVariant {
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

function shortId(value: string): string {
  return value.length <= 8 ? value : `${value.slice(0, 8)}…`;
}

export function RulesTable({ rules, selectedId, onSelect }: Props) {
  return (
    <Table caption="Rules catalog (mock data)">
      <thead>
        <tr>
          <th scope="col">Rule</th>
          <th scope="col">Title</th>
          <th scope="col">Status</th>
          <th scope="col">Version</th>
          <th scope="col">Violation</th>
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => {
          const isSelected = rule.ruleId === selectedId;
          return (
            <tr
              key={rule.ruleId}
              className={
                isSelected
                  ? `${styles.row} ${styles.rowActive}`
                  : styles.row
              }
              onClick={() => onSelect(rule)}
              aria-selected={isSelected}
            >
              <td>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(rule);
                  }}
                  className={styles.idButton}
                >
                  {shortId(rule.ruleId)}
                </button>
              </td>
              <td>{rule.title ?? "—"}</td>
              <td>
                <StatusBadge variant={statusVariant(rule.status)}>
                  {rule.status}
                </StatusBadge>
              </td>
              <td className={styles.mono}>v{rule.ruleVersion}</td>
              <td className={styles.mono}>
                {shortId(rule.violationRef.violationId)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
