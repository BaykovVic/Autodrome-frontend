/**
 * Console-shaped vehicle snapshot.
 *
 * Backend Vehicle contract has plateNumber/type/model/etc. The
 * registry visual surface adds device-state and equipment-health
 * blocks, which today are not in any canonical DTO. They live in
 * the snapshot until the device-telemetry contract lands.
 */
export type VehicleDeviceState =
  | "online"
  | "degraded"
  | "offline"
  | "standby";

export type VehicleEquipmentState =
  | "ok"
  | "watch"
  | "fault";

export type ConsoleEquipmentRow = {
  name: string;
  state: VehicleEquipmentState;
  label: string;
};

export type ConsoleVehicle = {
  id: string;
  model: string;
  plate: string;
  category: string;
  device: {
    state: VehicleDeviceState;
    label: string;
  };
  firmware: string;
  lastSeen: string;
  equipment: ConsoleEquipmentRow[];
};

export type ConsoleVehiclesSnapshot = {
  totals: {
    total: number;
    degraded: number;
    offline: number;
  };
  vehicles: ConsoleVehicle[];
};
