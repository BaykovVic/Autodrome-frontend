import { Button, EmptyState, StatusBadge } from "@/components";
import type { ServiceHealth } from "./serviceHealth";
import styles from "./ServiceHealthDetail.module.css";

type Props = {
  service: ServiceHealth;
  onClose: () => void;
};

export function ServiceHealthDetail({ service, onClose }: Props) {
  const hasIncident = !!service.errorMessage || !!service.correlationId;

  return (
    <aside
      className={styles.panel}
      aria-label={`Service ${service.name}`}
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.heading}>{service.name}</h3>
          <p className={styles.subtitle}>
            <span className={styles.mono}>{service.id}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close detail"
        >
          Close
        </Button>
      </header>

      <Section title="Status">
        <dl className={styles.list}>
          <Row label="Kind">
            <StatusBadge variant="neutral">{service.kind}</StatusBadge>
          </Row>
          <Row label="Liveness">
            <StatusBadge>{service.liveness}</StatusBadge>
          </Row>
          <Row label="Readiness">
            <StatusBadge>{service.readiness}</StatusBadge>
          </Row>
          <Row label="Last check">
            <span className={styles.mono}>{service.lastCheckAt}</span>
          </Row>
        </dl>
      </Section>

      <Section title="Latest incident">
        {hasIncident ? (
          <dl className={styles.list}>
            {service.errorMessage ? (
              <Row label="Message">
                <span>{service.errorMessage}</span>
              </Row>
            ) : null}
            {service.correlationId ? (
              <Row label="Correlation id">
                <span className={styles.mono}>
                  {service.correlationId}
                </span>
              </Row>
            ) : null}
          </dl>
        ) : (
          <EmptyState
            title="No recent incidents"
            description="This service has been healthy in the latest probe."
          />
        )}
      </Section>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{children}</dd>
    </div>
  );
}
