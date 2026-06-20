"use client";

import { useState, type FormEvent } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  Input,
  Modal,
  Select,
  StatusBadge,
  Textarea,
  ValidationErrors,
  type ValidationIssue,
} from "@/components";
import type { components } from "@/contracts/types/violation-rule";
import styles from "./ViolationCreateForm.module.css";

type ViolationCreation = components["schemas"]["ViolationCreation"];
type Severity = components["schemas"]["Severity"];
type Violation = components["schemas"]["Violation"];

type FormShape = {
  code: string;
  title: string;
  description: string;
  severity: Severity;
};

const EMPTY_FORM: FormShape = {
  code: "",
  title: "",
  description: "",
  severity: "medium",
};

function buildPayload(form: FormShape): ViolationCreation {
  const payload: ViolationCreation = {
    code: form.code.trim(),
    title: form.title.trim(),
    severity: form.severity,
  };
  if (form.description.trim()) {
    payload.description = form.description.trim();
  }
  return payload;
}

function validate(form: FormShape): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!form.code.trim()) {
    issues.push({ field: "code", message: "Code is required" });
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
  onSuccess?: (violation: Violation) => void;
};

export function ViolationCreateForm({
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
      const { data } = await api.violationRule.POST("/violations", {
        params: {
          header: { "Idempotency-Key": crypto.randomUUID() },
        },
        body: buildPayload(form),
      });
      const violation = data as Violation | undefined;
      if (violation?.violationId) {
        setSuccessId(violation.violationId);
        setForm(EMPTY_FORM);
        onSuccess?.(violation);
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
      ariaLabel="Create a new violation"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <h2 className={styles.title}>Create violation</h2>
          <p className={styles.subtitle}>
            Payload shape follows
            <span className={styles.mono}> ViolationCreation</span>
            from violation-rule-service OpenAPI contract.
          </p>
        </header>

        {issues.length > 0 ? <ValidationErrors issues={issues} /> : null}
        {serverError ? <ApiErrorView error={serverError} /> : null}
        {successId ? (
          <div className={styles.success}>
            <StatusBadge variant="success">created</StatusBadge>
            <span>
              New violation id{" "}
              <span className={styles.mono}>{successId}</span>
            </span>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Input
            id="violation-code-create"
            label="Code"
            required
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
            invalid={issues.some((i) => i.field === "code")}
            hint="UPPER_SNAKE_CASE machine-readable id"
          />
          <Input
            id="violation-title-create"
            label="Title"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            invalid={issues.some((i) => i.field === "title")}
          />
          <Select
            id="violation-severity-create"
            label="Severity"
            value={form.severity}
            onChange={(e) =>
              update("severity", e.target.value as Severity)
            }
          >
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </Select>
          <Textarea
            id="violation-description-create"
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
            {submitting ? "Submitting…" : "Create violation"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
