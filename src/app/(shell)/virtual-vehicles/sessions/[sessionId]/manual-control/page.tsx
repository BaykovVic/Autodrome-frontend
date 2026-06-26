import { VirtualVehicleManualControlPanelScreen } from "../../_components/manual-control/VirtualVehicleManualControlPanelScreen";

export default async function VirtualVehicleManualControlPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <VirtualVehicleManualControlPanelScreen sessionId={sessionId} />;
}
