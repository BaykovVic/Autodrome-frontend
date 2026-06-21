import { ConsoleCard } from "@/components";
import type { OutboxBacklog } from "./consoleDashboardSnapshot";
import styles from "./OutboxBacklogWidget.module.css";

type Props = {
  data: OutboxBacklog;
};

function asideLabel(status: OutboxBacklog["status"]): {
  text: string;
  className: string;
} {
  return status === "paused"
    ? { text: "Paused", className: styles.statusPaused }
    : { text: "Live", className: styles.statusLive };
}

export function OutboxBacklogWidget({ data }: Props) {
  const max = Math.max(1, ...data.sparkline);
  const aside = asideLabel(data.status);
  return (
    <ConsoleCard
      header={<HeaderRow status={aside} />}
    >
      <div className={styles.body}>
        <div className={styles.row}>
          <div>
            <span className={styles.value}>{data.queued}</span>
            <div className={styles.label}>queued events</div>
          </div>
          <div
            className={styles.sparkline}
            aria-label="Recent backlog sparkline"
          >
            {data.sparkline.map((value, idx) => {
              const heightPct = Math.round((value / max) * 100);
              const isLast = idx === data.sparkline.length - 1;
              return (
                <span
                  key={idx}
                  className={styles.bar}
                  style={{
                    height: `${Math.max(8, heightPct)}%`,
                    background:
                      isLast && data.status === "paused"
                        ? "var(--color-warning)"
                        : "#cfd8d6",
                  }}
                />
              );
            })}
          </div>
        </div>
        {data.nextRetryNote ? (
          <p className={styles.note}>{data.nextRetryNote}</p>
        ) : null}
      </div>
    </ConsoleCard>
  );
}

function HeaderRow({
  status,
}: {
  status: { text: string; className: string };
}) {
  return (
    <div className={styles.headerRow}>
      <span className={styles.headerTitle}>Outbox / event backlog</span>
      <span className={status.className}>{status.text}</span>
    </div>
  );
}
