import { Button } from "@/components";
import type { DashboardDegradedNotice } from "./consoleDashboardSnapshot";
import styles from "./DegradedNoticeBanner.module.css";

type Props = {
  notice: DashboardDegradedNotice;
};

export function DegradedNoticeBanner({ notice }: Props) {
  return (
    <section
      className={styles.banner}
      role="alert"
      aria-label="Dashboard degraded notice"
    >
      <svg
        className={styles.icon}
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M12 4l8.5 15h-17z" />
        <path d="M12 10v4" />
        <circle cx="12" cy="16.8" r=".4" />
      </svg>
      <div className={styles.body}>
        <div className={styles.title}>{notice.title}</div>
        <div className={styles.detail}>{notice.detail}</div>
      </div>
      {(notice.secondaryAction || notice.primaryAction) && (
        <div className={styles.actions}>
          {notice.secondaryAction ? (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled
              title="Action is preview-only until the broker integration lands."
            >
              {notice.secondaryAction}
            </Button>
          ) : null}
          {notice.primaryAction ? (
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled
              title="Action is preview-only until the broker integration lands."
            >
              {notice.primaryAction}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
