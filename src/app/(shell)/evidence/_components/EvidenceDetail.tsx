import { Button, EmptyState, StatusBadge } from "@/components";
import type { RecordingItem } from "./defaultRecordingsLoader";
import { recordingModalities } from "./applyEvidenceFilters";
import styles from "./EvidenceDetail.module.css";

type Props = {
  record: RecordingItem;
  onClose: () => void;
};

const SOURCE_LABELS: Record<string, string> = {
  cabinFront: "Cabin — front camera",
  cabinSide: "Cabin — side camera",
  exteriorFront: "Exterior — front camera",
  exteriorRear: "Exterior — rear camera",
  microphone: "Cabin microphone",
};

function sourceLabel(kind: string): string {
  return SOURCE_LABELS[kind] ?? kind;
}

export function EvidenceDetail({ record, onClose }: Props) {
  const modalities = recordingModalities(record);

  return (
    <aside
      className={styles.panel}
      aria-label={`Recording ${record.recordingId}`}
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.heading}>Recording details</h3>
          <p className={styles.subtitle}>
            <span className={styles.mono}>{record.recordingId}</span>
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

      <Section title="Recording">
        <dl className={styles.list}>
          <Row label="Status">
            <StatusBadge>{record.status}</StatusBadge>
          </Row>
          <Row label="Linked exam">
            <span className={styles.mono}>{record.examRef.examId}</span>
          </Row>
          <Row label="Started">
            <span className={styles.mono}>{record.startedAt}</span>
          </Row>
          {record.finalizedAt ? (
            <Row label="Finalized">
              <span className={styles.mono}>{record.finalizedAt}</span>
            </Row>
          ) : null}
        </dl>
      </Section>

      <Section title="Sources">
        {record.sources && record.sources.length > 0 ? (
          <ul className={styles.sources}>
            {record.sources.map((source) => (
              <li key={source.sourceId} className={styles.sourceRow}>
                <div className={styles.sourceText}>
                  <span className={styles.sourceLabel}>
                    {sourceLabel(source.kind)}
                  </span>
                  <span className={styles.sourceId}>
                    {source.sourceId}
                  </span>
                </div>
                <StatusBadge
                  variant={
                    source.kind === "microphone" ? "info" : "neutral"
                  }
                >
                  {source.kind === "microphone" ? "audio" : "video"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No sources"
            description="This recording is not linked to any capture source."
          />
        )}
      </Section>

      <Section title="Media segments">
        <EmptyState
          title="Open the dedicated viewer for playback"
          description="This view shows the recording metadata. Use the dedicated viewer for playback and the export tool for downloads."
        />
      </Section>

      <Section title="Other evidence for this exam">
        <p className={styles.evidenceHint}>
          Biometry and telemetry evidence linked to this exam are
          presented in their own workspaces.
        </p>
        <div className={styles.evidenceBadges}>
          {modalities.includes("video") ? (
            <StatusBadge variant="neutral">video</StatusBadge>
          ) : null}
          {modalities.includes("audio") ? (
            <StatusBadge variant="info">audio</StatusBadge>
          ) : null}
          <StatusBadge variant="warning">biometry · linked</StatusBadge>
          <StatusBadge variant="warning">telemetry · linked</StatusBadge>
        </div>
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
