import type { AutodromeApi } from "@/api/adapter";
import { Button, EmptyState, StatusBadge } from "@/components";
import { RulePublishForm } from "./RulePublishForm";
import type { RuleDefinition } from "./useRulesData";
import styles from "./RuleDetail.module.css";

type Props = {
  api: AutodromeApi;
  rule: RuleDefinition;
  onClose: () => void;
  onUpdated: (next: RuleDefinition) => void;
};

export function RuleDetail({ api, rule, onClose, onUpdated }: Props) {
  return (
    <aside
      className={styles.panel}
      aria-label={`Rule ${rule.ruleId}`}
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.heading}>
            {rule.title ?? "Rule"}
          </h3>
          <p className={styles.subtitle}>
            <span className={styles.mono}>{rule.ruleId}</span>
            <span className={styles.metaSeparator}>·</span>
            <StatusBadge variant="info">v{rule.ruleVersion}</StatusBadge>
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

      <Section title="Rule">
        <dl className={styles.list}>
          <Row label="Status">
            <StatusBadge>{rule.status}</StatusBadge>
          </Row>
          <Row label="Version">
            <span className={styles.mono}>{rule.ruleVersion}</span>
          </Row>
          <Row label="Violation">
            <span className={styles.mono}>
              {rule.violationRef.violationId}
            </span>
          </Row>
          {rule.description ? (
            <Row label="Description">
              <span>{rule.description}</span>
            </Row>
          ) : null}
          <Row label="Created at">
            <span className={styles.mono}>{rule.createdAt}</span>
          </Row>
          {rule.updatedAt ? (
            <Row label="Updated at">
              <span className={styles.mono}>{rule.updatedAt}</span>
            </Row>
          ) : null}
          {rule.publishedAt ? (
            <Row label="Published at">
              <span className={styles.mono}>{rule.publishedAt}</span>
            </Row>
          ) : null}
        </dl>
      </Section>

      <Section title="Conditions">
        {rule.conditionTree &&
        Object.keys(rule.conditionTree).length > 0 ? (
          <p className={styles.conditionMeta}>
            {Object.keys(rule.conditionTree).length} parameter
            group(s) defined
          </p>
        ) : (
          <EmptyState
            title="No conditions defined"
            description="This rule has no condition parameters."
          />
        )}
      </Section>

      <Section title="Publish">
        <RulePublishForm api={api} rule={rule} onPublished={onUpdated} />
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
