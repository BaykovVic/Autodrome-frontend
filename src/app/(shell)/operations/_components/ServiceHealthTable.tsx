import {
  StatusBadge,
  type StatusBadgeVariant,
  Table,
} from "@/components";
import type {
  ServiceHealth,
  ServiceHealthStatus,
} from "./serviceHealth";
import styles from "./ServiceHealthTable.module.css";

type Props = {
  services: ServiceHealth[];
  selectedId?: string;
  onSelect: (service: ServiceHealth) => void;
};

function statusVariant(status: ServiceHealthStatus): StatusBadgeVariant {
  switch (status) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "down":
      return "danger";
    case "unknown":
    default:
      return "neutral";
  }
}

export function ServiceHealthTable({
  services,
  selectedId,
  onSelect,
}: Props) {
  return (
    <Table caption="Service health and readiness">
      <thead>
        <tr>
          <th scope="col">Service</th>
          <th scope="col">Kind</th>
          <th scope="col">Liveness</th>
          <th scope="col">Readiness</th>
          <th scope="col">Last check</th>
        </tr>
      </thead>
      <tbody>
        {services.map((service) => {
          const isSelected = service.id === selectedId;
          return (
            <tr
              key={service.id}
              className={
                isSelected
                  ? `${styles.row} ${styles.rowActive}`
                  : styles.row
              }
              onClick={() => onSelect(service)}
              aria-selected={isSelected}
            >
              <td>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(service);
                  }}
                  className={styles.nameButton}
                >
                  {service.name}
                </button>
                <div className={styles.mono}>{service.id}</div>
              </td>
              <td>{service.kind}</td>
              <td>
                <StatusBadge variant={statusVariant(service.liveness)}>
                  {service.liveness}
                </StatusBadge>
              </td>
              <td>
                <StatusBadge variant={statusVariant(service.readiness)}>
                  {service.readiness}
                </StatusBadge>
              </td>
              <td className={styles.mono}>{service.lastCheckAt}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
