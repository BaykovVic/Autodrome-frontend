import {
  ConsoleCard,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import type {
  DashboardServiceRow,
  ServiceHealthState,
} from "./consoleDashboardSnapshot";
import styles from "./ServiceHealthWidget.module.css";

type Props = {
  services: DashboardServiceRow[];
};

function dotVariant(state: ServiceHealthState): StatusDotVariant {
  switch (state) {
    case "healthy":
      return "online";
    case "degraded":
      return "degraded";
    case "down":
      return "offline";
    default:
      return "unknown";
  }
}

function badgeVariant(state: ServiceHealthState): StatusBadgeVariant {
  switch (state) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "down":
      return "danger";
    default:
      return "neutral";
  }
}

export function ServiceHealthWidget({ services }: Props) {
  return (
    <ConsoleCard
      className={styles.widget}
      flush
      header="Service health"
      headerAside={`${services.length} services`}
    >
      <ul className={styles.list} aria-label="Service health rows">
        {services.map((service) => (
          <li key={service.id} className={styles.row}>
            <span className={styles.name}>{service.name}</span>
            <div className={styles.meta}>
              {service.meta ? (
                <span className={styles.mono}>{service.meta}</span>
              ) : null}
              <span className={styles.badge}>
                <StatusDot
                  variant={dotVariant(service.state)}
                  halo={false}
                />
                <StatusBadge variant={badgeVariant(service.state)}>
                  {service.badgeLabel}
                </StatusBadge>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </ConsoleCard>
  );
}
