import styles from "./page.module.css";

const consoleSections = [
  { key: "candidates", title: "Candidates", status: "placeholder" },
  { key: "vehicles", title: "Vehicles", status: "placeholder" },
  { key: "exams", title: "Exams", status: "placeholder" },
  { key: "exercises", title: "Exercises", status: "placeholder" },
  { key: "violations", title: "Violations & Rules", status: "placeholder" },
  { key: "telemetry", title: "Vehicle Telemetry", status: "placeholder" },
  { key: "media", title: "Media Archive", status: "placeholder" },
  { key: "audit", title: "Audit", status: "placeholder" },
];

export default function OperatorConsolePlaceholder() {
  return (
    <main className={styles.console}>
      <header className={styles.header}>
        <h1 className={styles.title}>Autodrome Operator Console</h1>
        <p className={styles.subtitle}>
          Skeleton build. Operator and admin surfaces are not implemented yet.
        </p>
      </header>

      <section aria-label="Console sections" className={styles.sections}>
        {consoleSections.map((section) => (
          <article key={section.key} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionStatus}>{section.status}</p>
          </article>
        ))}
      </section>

      <footer className={styles.footer}>
        <p>Skeleton mode. No backend connection. No domain logic.</p>
      </footer>
    </main>
  );
}
