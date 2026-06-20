import type { AutodromeApi } from "@/api/adapter";
import { Button, EmptyState, StatusBadge } from "@/components";
import type { ExamItem } from "./defaultExamsLoader";
import { ExamLifecycleActions } from "./ExamLifecycleActions";
import styles from "./ExamDetail.module.css";

type Props = {
  api: AutodromeApi;
  exam: ExamItem;
  onClose: () => void;
  onUpdated: (exam: ExamItem) => void;
};

export function ExamDetail({ api, exam, onClose, onUpdated }: Props) {
  return (
    <aside
      className={styles.panel}
      aria-label={`Exam ${exam.examId}`}
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.heading}>Exam</h3>
          <p className={styles.subtitle}>
            <span className={styles.mono}>{exam.examId}</span>
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

      <Section title="Exam">
        <dl className={styles.list}>
          <Row label="Status">
            <StatusBadge>{exam.status}</StatusBadge>
          </Row>
          <Row label="Type">
            <span className={styles.mono}>{exam.examType}</span>
          </Row>
          <Row label="Candidate">
            <span className={styles.mono}>{exam.candidateRef.candidateId}</span>
          </Row>
          <Row label="Vehicle">
            <span className={styles.mono}>{exam.vehicleRef.vehicleId}</span>
          </Row>
          <Row label="Scheduled at">
            <span className={styles.mono}>{exam.scheduledAt}</span>
          </Row>
          {exam.startedAt ? (
            <Row label="Started at">
              <span className={styles.mono}>{exam.startedAt}</span>
            </Row>
          ) : null}
          {exam.finishedAt ? (
            <Row label="Finished at">
              <span className={styles.mono}>{exam.finishedAt}</span>
            </Row>
          ) : null}
          {exam.outcome ? (
            <Row label="Outcome">
              <StatusBadge
                variant={exam.outcome === "passed" ? "success" : "danger"}
              >
                {exam.outcome}
              </StatusBadge>
            </Row>
          ) : null}
          {exam.score !== undefined ? (
            <Row label="Score">
              <span className={styles.mono}>{exam.score}</span>
            </Row>
          ) : null}
        </dl>
      </Section>

      <Section title="Lifecycle actions">
        <ExamLifecycleActions
          api={api}
          exam={exam}
          onUpdated={onUpdated}
        />
      </Section>

      <Section title="Timeline">
        <EmptyState
          title="Timeline placeholder"
          description="Per-exam timeline endpoint exists in the contract; rendering will land with the dedicated timeline feature once telemetry/media data is plumbed in."
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
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{children}</dd>
    </div>
  );
}
