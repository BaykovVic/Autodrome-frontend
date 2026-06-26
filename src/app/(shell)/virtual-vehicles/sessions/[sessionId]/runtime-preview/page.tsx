import { VirtualVehicleRuntimePreviewScreen } from "../../_components/runtime-preview/VirtualVehicleRuntimePreviewScreen";

export default async function VirtualVehicleRuntimePreviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <VirtualVehicleRuntimePreviewScreen sessionId={sessionId} />;
}
