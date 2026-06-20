import { StatusBadge, type StatusBadgeVariant, Table } from "@/components";
import type { Vehicle, VehicleStatus } from "./useVehiclesData";
import styles from "./VehiclesTable.module.css";

type Props = {
  vehicles: Vehicle[];
  selectedId?: string;
  onSelect: (vehicle: Vehicle) => void;
};

function statusVariant(status: VehicleStatus): StatusBadgeVariant {
  switch (status) {
    case "active":
      return "success";
    case "registered":
      return "info";
    case "maintenance":
      return "warning";
    case "decommissioned":
      return "neutral";
    default:
      return "neutral";
  }
}

export function VehiclesTable({ vehicles, selectedId, onSelect }: Props) {
  return (
    <Table caption="Vehicles registry (mock data)">
      <thead>
        <tr>
          <th scope="col">Plate</th>
          <th scope="col">Model</th>
          <th scope="col">Type</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => {
          const isSelected = vehicle.vehicleId === selectedId;
          return (
            <tr
              key={vehicle.vehicleId}
              className={
                isSelected
                  ? `${styles.row} ${styles.rowActive}`
                  : styles.row
              }
              onClick={() => onSelect(vehicle)}
              aria-selected={isSelected}
            >
              <td>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(vehicle);
                  }}
                  className={styles.plateButton}
                >
                  {vehicle.plateNumber}
                </button>
              </td>
              <td>{vehicle.model}</td>
              <td className={styles.mono}>{vehicle.type}</td>
              <td>
                <StatusBadge variant={statusVariant(vehicle.status)}>
                  {vehicle.status}
                </StatusBadge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
