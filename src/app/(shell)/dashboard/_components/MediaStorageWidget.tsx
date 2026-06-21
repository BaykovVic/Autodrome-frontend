import { ConsoleCard } from "@/components";
import type { MediaStorage } from "./consoleDashboardSnapshot";
import styles from "./MediaStorageWidget.module.css";

type Props = {
  data: MediaStorage;
};

const SEGMENT_PALETTE = [
  "var(--color-accent)",
  "#5bb6ab",
  "var(--color-warning)",
  "var(--color-danger)",
];

function summaryClass(
  summary: MediaStorage["summary"],
): string {
  switch (summary) {
    case "Watch":
      return styles.summaryWatch;
    case "Degraded":
      return styles.summaryDegraded;
    case "Healthy":
    default:
      return styles.summaryOk;
  }
}

export function MediaStorageWidget({ data }: Props) {
  const safeTotal = data.totalGb > 0 ? data.totalGb : 1;

  return (
    <ConsoleCard header="Media storage">
      <div className={styles.body}>
        <div className={styles.headline}>
          <span className={styles.value}>
            {data.usedGb}
            <span className={styles.totalNote}>
              {" / "}
              {data.totalGb} GB
            </span>
          </span>
          <span className={summaryClass(data.summary)}>{data.summary}</span>
        </div>
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={data.totalGb}
          aria-valuenow={data.usedGb}
          aria-label="Media storage usage"
        >
          {data.segments.map((segment, idx) => {
            const pct = (segment.gb / safeTotal) * 100;
            return (
              <div
                key={segment.label}
                className={styles.barSegment}
                style={{
                  width: `${pct}%`,
                  background:
                    SEGMENT_PALETTE[idx] ?? "var(--color-neutral)",
                }}
              />
            );
          })}
        </div>
        <div className={styles.legend}>
          {data.segments.map((segment, idx) => (
            <span key={segment.label} className={styles.legendItem}>
              <span
                className={styles.swatch}
                style={{
                  background:
                    SEGMENT_PALETTE[idx] ?? "var(--color-neutral)",
                }}
                aria-hidden="true"
              />
              {segment.label} {segment.gb} GB
            </span>
          ))}
        </div>
      </div>
    </ConsoleCard>
  );
}
