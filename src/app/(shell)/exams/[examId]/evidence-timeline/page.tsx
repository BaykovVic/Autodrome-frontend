import { ExamEvidenceTimelineScreen } from "../../_components/ExamEvidenceTimelineScreen";

type PageProps = {
  params: Promise<{ examId: string }>;
};

export default async function ExamEvidenceTimelinePage({ params }: PageProps) {
  const { examId } = await params;
  return <ExamEvidenceTimelineScreen examId={examId} />;
}
