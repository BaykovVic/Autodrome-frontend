import { ConsoleCard, StatusDot } from "@/components";
import type { DatabaseReadiness } from "./consoleDashboardSnapshot";
import styles from "./DatabaseReadinessWidget.module.css";

type Props = {
  data: DatabaseReadiness;
};

export function DatabaseReadinessWidget({ data }: Props) {
  return (
    <ConsoleCard header="Database readiness">
      <div className={styles.body}>
        <div className={styles.statusRow}>
          <StatusDot
            variant={data.schemaReady ? "online" : "offline"}
            label={
              data.schemaReady
                ? "Database schema ready"
                : "Database schema not ready"
            }
          />
          <span
            className={
              data.schemaReady ? styles.headlineOk : styles.headlineWarn
            }
          >
            {data.schemaReady ? "Schema ready" : "Schema not ready"}
          </span>
          <span className={styles.mono}>{data.migrationLabel}</span>
        </div>
        <dl className={styles.grid}>
          <Metric label="Pending writes" value={data.pendingWrites} />
          <Metric label="Open sessions" value={data.openSessions} />
          <Metric
            label="WAL queue"
            value={`${data.walQueueMb.toFixed(1)} MB`}
          />
          <Metric label="Last vacuum" value={data.lastVacuum} />
        </dl>
      </div>
    </ConsoleCard>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}
