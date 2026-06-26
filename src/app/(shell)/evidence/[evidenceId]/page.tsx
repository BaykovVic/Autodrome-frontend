import { EvidenceDetailScreen } from "../_components/EvidenceDetailScreen";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ evidenceId: string }>;
}) {
  const { evidenceId } = await params;
  return <EvidenceDetailScreen evidenceId={evidenceId} />;
}
