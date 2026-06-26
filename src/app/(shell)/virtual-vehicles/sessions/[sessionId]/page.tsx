import { VirtualVehicleSessionMonitorScreen } from "../_components/VirtualVehicleSessionMonitorScreen";

export default async function VirtualVehicleSessionMonitorPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <VirtualVehicleSessionMonitorScreen sessionId={sessionId} />;
}
