import { ConsoleCard } from "@/components";
import type { VehicleTelemetry } from "./consoleDashboardSnapshot";
import styles from "./VehicleTelemetryWidget.module.css";

type Props = {
  data: VehicleTelemetry;
};

const TILE_STYLE: Record<string, string> = {
  online: styles.tileOnline,
  degraded: styles.tileDegraded,
  offline: styles.tileOffline,
  standby: styles.tileStandby,
};

export function VehicleTelemetryWidget({ data }: Props) {
  return (
    <ConsoleCard header="Vehicle telemetry">
      <div className={styles.body}>
        <div className={styles.tiles}>
          {data.tiles.map((tile) => (
            <div
              key={tile.label}
              className={`${styles.tile} ${
                TILE_STYLE[tile.tone] ?? styles.tileStandby
              }`}
            >
              <div className={styles.tileValue}>{tile.value}</div>
              <div className={styles.tileLabel}>{tile.label}</div>
            </div>
          ))}
        </div>
        {data.staleNote ? (
          <p className={styles.staleNote}>{data.staleNote}</p>
        ) : null}
      </div>
    </ConsoleCard>
  );
}
