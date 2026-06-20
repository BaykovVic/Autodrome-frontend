import { Button, EmptyState, StatusBadge } from "@/components";
import type { Violation } from "./useViolationsData";
import styles from "./ViolationDetail.module.css";

type Props = {
  violation: Violation;
  onClose: () => void;
};

export function ViolationDetail({ violation, onClose }: Props) {
  return (
    <aside
      className={styles.panel}
      aria-label={`Violation ${violation.code}`}
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.heading}>{violation.title}</h3>
          <p className={styles.subtitle}>
            <span className={styles.mono}>{violation.code}</span>
            <span className={styles.metaSeparator}>·</span>
            <span className={styles.mono}>{violation.violationId}</span>
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

      <Section title="Violation">
        <dl className={styles.list}>
          <Row label="Severity">
            <StatusBadge>{violation.severity}</StatusBadge>
          </Row>
          {violation.description ? (
            <Row label="Description">
              <span>{violation.description}</span>
            </Row>
          ) : null}
          <Row label="Created at">
            <span className={styles.mono}>{violation.createdAt}</span>
          </Row>
          {violation.updatedAt ? (
            <Row label="Updated at">
              <span className={styles.mono}>{violation.updatedAt}</span>
            </Row>
          ) : null}
        </dl>
      </Section>

      <Section title="Active rule version">
        {violation.activeRuleVersion ? (
          <dl className={styles.list}>
            <Row label="Rule id">
              <span className={styles.mono}>
                {violation.activeRuleVersion.ruleId}
              </span>
            </Row>
            <Row label="Rule version">
              <StatusBadge variant="info">
                v{violation.activeRuleVersion.ruleVersion}
              </StatusBadge>
            </Row>
            <p className={styles.note}>
              Rule binding editor and rule evaluation are intentionally
              out of scope for this baseline.
            </p>
          </dl>
        ) : (
          <EmptyState
            title="No active rule version"
            description="Bind a published rule via rule-catalog feature (out of scope here)."
          />
        )}
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
