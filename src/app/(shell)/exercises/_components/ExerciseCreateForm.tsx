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
import type { components } from "@/contracts/types/exercise";
import styles from "./ExerciseCreateForm.module.css";

type ExerciseCreation = components["schemas"]["ExerciseCreation"];
type Exercise = components["schemas"]["Exercise"];

type FormShape = {
  code: string;
  title: string;
  description: string;
};

const EMPTY_FORM: FormShape = {
  code: "",
  title: "",
  description: "",
};

function buildPayload(form: FormShape): ExerciseCreation {
  const payload: ExerciseCreation = {
    code: form.code.trim(),
    title: form.title.trim(),
  };
  if (form.description.trim()) payload.description = form.description.trim();
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
  onSuccess?: (exercise: Exercise) => void;
};

export function ExerciseCreateForm({
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
      const { data } = await api.exercise.POST("/exercises", {
        params: {
          header: {
            "Idempotency-Key": crypto.randomUUID(),
          },
        },
        body: buildPayload(form),
      });
      const exercise = data as Exercise | undefined;
      if (exercise?.exerciseId) {
        setSuccessId(exercise.exerciseId);
        setForm(EMPTY_FORM);
        onSuccess?.(exercise);
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
      ariaLabel="Create a new exercise"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <h2 className={styles.title}>Create exercise</h2>
          <p className={styles.subtitle}>
            Payload shape follows
            <span className={styles.mono}> ExerciseCreation</span>
            from exercise-service OpenAPI contract.
          </p>
        </header>

        {issues.length > 0 ? <ValidationErrors issues={issues} /> : null}
        {serverError ? <ApiErrorView error={serverError} /> : null}
        {successId ? (
          <div className={styles.success}>
            <StatusBadge variant="success">created</StatusBadge>
            <span>
              New exercise id <span className={styles.mono}>{successId}</span>
            </span>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Input
            id="exercise-code-create"
            label="Code"
            required
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
            invalid={issues.some((i) => i.field === "code")}
            hint="Short stable identifier"
          />
          <Input
            id="exercise-title-create"
            label="Title"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            invalid={issues.some((i) => i.field === "title")}
          />
          <Textarea
            id="exercise-description-create"
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
            {submitting ? "Submitting…" : "Create exercise"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
