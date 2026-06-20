import { Button, EmptyState, StatusBadge } from "@/components";
import type { Vehicle } from "./useVehiclesData";
import styles from "./VehicleDetail.module.css";

type Props = {
  vehicle: Vehicle;
  onClose: () => void;
};

export function VehicleDetail({ vehicle, onClose }: Props) {
  return (
    <aside
      className={styles.panel}
      aria-label={`Vehicle ${vehicle.plateNumber}`}
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.heading}>
            {vehicle.plateNumber} · {vehicle.model}
          </h3>
          <p className={styles.subtitle}>
            <span className={styles.mono}>{vehicle.vehicleId}</span>
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

      <Section title="Vehicle">
        <dl className={styles.list}>
          <Row label="Status">
            <StatusBadge>{vehicle.status}</StatusBadge>
          </Row>
          <Row label="Type">
            <span className={styles.mono}>{vehicle.type}</span>
          </Row>
          {vehicle.manufactureYear !== undefined ? (
            <Row label="Manufacture year">
              <span className={styles.mono}>{vehicle.manufactureYear}</span>
            </Row>
          ) : null}
          {vehicle.vin ? (
            <Row label="VIN">
              <span className={styles.mono}>{vehicle.vin}</span>
            </Row>
          ) : null}
          <Row label="Created at">
            <span className={styles.mono}>{vehicle.createdAt}</span>
          </Row>
        </dl>
      </Section>

      <Section title="Equipment">
        {vehicle.boundEdgeGateway || vehicle.boundDevice ? (
          <dl className={styles.list}>
            {vehicle.boundEdgeGateway ? (
              <Row label="Edge gateway">
                <span className={styles.mono}>
                  {vehicle.boundEdgeGateway.edgeGatewayId}
                </span>
              </Row>
            ) : null}
            {vehicle.boundDevice ? (
              <Row label="Device">
                <span className={styles.mono}>
                  {vehicle.boundDevice.deviceId}
                </span>
              </Row>
            ) : null}
          </dl>
        ) : (
          <EmptyState
            title="No bound equipment"
            description="Bind edge gateway / device endpoints are not surfaced here yet."
          />
        )}
      </Section>

      <Section title="Telemetry">
        <EmptyState
          title="Telemetry placeholder"
          description="Live telemetry stream is intentionally out of scope; will surface once the edge contract lands."
        />
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
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}
