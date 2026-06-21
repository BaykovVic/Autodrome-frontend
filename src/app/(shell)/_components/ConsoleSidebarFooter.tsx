import styles from "./ConsoleSidebarFooter.module.css";

type Props = {
  /**
   * Free-form storage caption (e.g. "588 / 1000 GB"). Shown
   * mono-aligned on the right side of the upper row.
   */
  storageLabel?: string;
  /** 0..1 used by the progress bar. Out-of-range values are clamped. */
  storageProgress?: number;
  /** Free-form build caption shown on the bottom-left. */
  buildLabel?: string;
  /** Free-form version caption shown on the bottom-right. */
  versionLabel?: string;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function ConsoleSidebarFooter({
  storageLabel = "— / —",
  storageProgress = 0,
  buildLabel = "Build — · offline",
  versionLabel = "v0.0.0",
}: Props) {
  const pct = clamp01(storageProgress) * 100;

  return (
    <div className={styles.footer} aria-label="Local node storage">
      <div className={styles.row}>
        <span className={styles.muted}>Node storage</span>
        <span className={styles.mono}>{storageLabel}</span>
      </div>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Node storage usage"
      >
        <div
          className={styles.barFill}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.smallMuted}>{buildLabel}</span>
        <span className={styles.monoSmall}>{versionLabel}</span>
      </div>
    </div>
  );
}
