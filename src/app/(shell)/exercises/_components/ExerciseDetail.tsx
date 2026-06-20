import type { AutodromeApi } from "@/api/adapter";
import { Button, StatusBadge } from "@/components";
import { ExercisePublishForm } from "./ExercisePublishForm";
import { ExerciseVersionDetail } from "./ExerciseVersionDetail";
import type { Exercise } from "./useExercisesData";
import styles from "./ExerciseDetail.module.css";

type Props = {
  api: AutodromeApi;
  exercise: Exercise;
  onClose: () => void;
  onUpdated: (exercise: Exercise) => void;
};

export function ExerciseDetail({
  api,
  exercise,
  onClose,
  onUpdated,
}: Props) {
  return (
    <aside
      className={styles.panel}
      aria-label={`Exercise ${exercise.code}`}
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.heading}>{exercise.title}</h3>
          <p className={styles.subtitle}>
            <span className={styles.mono}>{exercise.code}</span>
            <span className={styles.metaSeparator}>·</span>
            <span className={styles.mono}>{exercise.exerciseId}</span>
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

      <Section title="Exercise">
        <dl className={styles.list}>
          <Row label="Status">
            <StatusBadge>{exercise.status}</StatusBadge>
          </Row>
          {exercise.description ? (
            <Row label="Description">
              <span>{exercise.description}</span>
            </Row>
          ) : null}
          <Row label="Created at">
            <span className={styles.mono}>{exercise.createdAt}</span>
          </Row>
          {exercise.updatedAt ? (
            <Row label="Updated at">
              <span className={styles.mono}>{exercise.updatedAt}</span>
            </Row>
          ) : null}
        </dl>
      </Section>

      <Section title="Current version">
        <ExerciseVersionDetail api={api} exercise={exercise} />
      </Section>

      <Section title="Publish">
        <ExercisePublishForm
          api={api}
          exercise={exercise}
          onPublished={onUpdated}
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
