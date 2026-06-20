"use client";

import { useState, type FormEvent } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  Input,
  Modal,
  StatusBadge,
  Textarea,
  ValidationErrors,
  type ValidationIssue,
} from "@/components";
import type { components } from "@/contracts/types/violation-rule";
import type { RuleDefinition } from "./useRulesData";
import styles from "./RuleDraftCreateForm.module.css";

type RuleDraft = components["schemas"]["RuleDraft"];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FormShape = {
  violationId: string;
  title: string;
  description: string;
};

const EMPTY_FORM: FormShape = {
  violationId: "",
  title: "",
  description: "",
};

function buildPayload(form: FormShape): RuleDraft {
  const payload: RuleDraft = {
    violationRef: { violationId: form.violationId.trim() },
    title: form.title.trim(),
  };
  if (form.description.trim()) {
    payload.description = form.description.trim();
  }
  return payload;
}

function validate(form: FormShape): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!UUID_PATTERN.test(form.violationId.trim())) {
    issues.push({
      field: "violationRef.violationId",
      message: "Violation id must be a UUID",
    });
  }
  if (!form.title.trim()) {
    issues.push({ field: "title", message: "Title is required" });
  }
  return issues;
}

type Props = {
  api: AutodromeApi;
  open: boolean;
  onClose: () => void;
  onSuccess?: (rule: RuleDefinition) => void;
};

export function RuleDraftCreateForm({
  api,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<FormShape>(EMPTY_FORM);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<unknown | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  function update<K extends keyof FormShape>(key: K, value: FormShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setIssues([]);
    setServerError(null);
    setSuccessId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();

    const nextIssues = validate(form);
    setIssues(nextIssues);
    if (nextIssues.length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.violationRule.POST("/rules", {
        params: {
          header: { "Idempotency-Key": crypto.randomUUID() },
        },
        body: buildPayload(form),
      });
      const rule = data as RuleDefinition | undefined;
      if (rule?.ruleId) {
        setSuccessId(rule.ruleId);
        setForm(EMPTY_FORM);
        onSuccess?.(rule);
      }
    } catch (error) {
      setServerError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      ariaLabel="Create a new rule draft"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <h2 className={styles.title}>Create rule draft</h2>
          <p className={styles.subtitle}>
            Payload shape follows
            <span className={styles.mono}> RuleDraft</span>
            from violation-rule-service OpenAPI contract. Visual
            condition editor is intentionally out of scope for this
            baseline — draft is created with an empty
            <span className={styles.mono}> conditionTree</span>.
          </p>
        </header>

        {issues.length > 0 ? <ValidationErrors issues={issues} /> : null}
        {serverError ? <ApiErrorView error={serverError} /> : null}
        {successId ? (
          <div className={styles.success}>
            <StatusBadge variant="success">created</StatusBadge>
            <span>
              New rule id <span className={styles.mono}>{successId}</span>
            </span>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Input
            id="rule-violation-id-create"
            label="Violation id (UUID)"
            required
            value={form.violationId}
            onChange={(e) => update("violationId", e.target.value)}
            invalid={issues.some(
              (i) => i.field === "violationRef.violationId",
            )}
            hint="UUID of the parent violation"
          />
          <Input
            id="rule-title-create"
            label="Title"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            invalid={issues.some((i) => i.field === "title")}
          />
          <Textarea
            id="rule-description-create"
            label="Description (optional)"
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <footer className={styles.footer}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Create draft"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
