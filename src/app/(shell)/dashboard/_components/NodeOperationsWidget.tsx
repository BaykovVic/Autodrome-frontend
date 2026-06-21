import { ConsoleCard } from "@/components";
import type { NodeOperationsItem } from "./consoleDashboardSnapshot";
import styles from "./NodeOperationsWidget.module.css";

type Props = {
  items: NodeOperationsItem[];
};

const TONE_CLASS: Record<string, string> = {
  ok: styles.toneOk,
  watch: styles.toneWatch,
  alert: styles.toneAlert,
  neutral: styles.toneNeutral,
};

export function NodeOperationsWidget({ items }: Props) {
  return (
    <ConsoleCard header="Node operations" flush>
      <dl className={styles.list}>
        {items.map((item) => (
          <div key={item.label} className={styles.row}>
            <dt className={styles.label}>{item.label}</dt>
            <dd
              className={`${styles.value} ${
                TONE_CLASS[item.tone ?? "neutral"] ?? styles.toneNeutral
              }`}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </ConsoleCard>
  );
}
