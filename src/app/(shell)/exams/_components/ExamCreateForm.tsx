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
  ValidationErrors,
  type ValidationIssue,
} from "@/components";
import type { components } from "@/contracts/types/exam";
import styles from "./ExamCreateForm.module.css";

type ExamCreation = components["schemas"]["ExamCreation"];
type ExamType = components["schemas"]["ExamType"];
type Exam = components["schemas"]["Exam"];

type FormShape = {
  candidateId: string;
  vehicleId: string;
  examType: ExamType;
  scheduledAt: string;
  notes: string;
};

const EMPTY_FORM: FormShape = {
  candidateId: "",
  vehicleId: "",
  examType: "autodromeBasic",
  scheduledAt: "",
  notes: "",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildPayload(form: FormShape): ExamCreation {
  const payload: ExamCreation = {
    candidateRef: { candidateId: form.candidateId.trim() },
    vehicleRef: { vehicleId: form.vehicleId.trim() },
    examType: form.examType,
    scheduledAt: form.scheduledAt,
  };
  if (form.notes.trim()) payload.notes = form.notes.trim();
  return payload;
}

function validate(form: FormShape): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!UUID_PATTERN.test(form.candidateId.trim())) {
    issues.push({
      field: "candidateRef.candidateId",
      message: "Candidate id must be a UUID",
    });
  }
  if (!UUID_PATTERN.test(form.vehicleId.trim())) {
    issues.push({
      field: "vehicleRef.vehicleId",
      message: "Vehicle id must be a UUID",
    });
  }
  if (!form.scheduledAt) {
    issues.push({
      field: "scheduledAt",
      message: "Scheduled time is required",
    });
  }
  return issues;
}

type Props = {
  api: AutodromeApi;
  open: boolean;
  onClose: () => void;
  onSuccess?: (exam: Exam) => void;
};

export function ExamCreateForm({ api, open, onClose, onSuccess }: Props) {
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
      const { data } = await api.exam.POST("/exams", {
        params: {
          header: {
            "Idempotency-Key": crypto.randomUUID(),
          },
        },
        body: buildPayload(form),
      });
      const exam = data as Exam | undefined;
      if (exam?.examId) {
        setSuccessId(exam.examId);
        setForm(EMPTY_FORM);
        onSuccess?.(exam);
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
      ariaLabel="Create a new exam"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <h2 className={styles.title}>Create exam</h2>
          <p className={styles.subtitle}>
            Payload shape follows
            <span className={styles.mono}> ExamCreation</span>
            from exam-service OpenAPI contract.
          </p>
        </header>

        {issues.length > 0 ? <ValidationErrors issues={issues} /> : null}
        {serverError ? <ApiErrorView error={serverError} /> : null}
        {successId ? (
          <div className={styles.success}>
            <StatusBadge variant="success">created</StatusBadge>
            <span>
              New exam id <span className={styles.mono}>{successId}</span>
            </span>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Input
            id="candidate-id"
            label="Candidate id (UUID)"
            required
            value={form.candidateId}
            onChange={(e) => update("candidateId", e.target.value)}
            invalid={issues.some(
              (i) => i.field === "candidateRef.candidateId",
            )}
          />
          <Input
            id="vehicle-id"
            label="Vehicle id (UUID)"
            required
            value={form.vehicleId}
            onChange={(e) => update("vehicleId", e.target.value)}
            invalid={issues.some(
              (i) => i.field === "vehicleRef.vehicleId",
            )}
          />
          <Select
            id="exam-type-create"
            label="Exam type"
            value={form.examType}
            onChange={(e) => update("examType", e.target.value as ExamType)}
          >
            <option value="autodromeBasic">autodromeBasic</option>
            <option value="autodromeAdvanced">autodromeAdvanced</option>
            <option value="retest">retest</option>
          </Select>
          <Input
            id="exam-scheduled-at"
            type="datetime-local"
            label="Scheduled at"
            required
            value={form.scheduledAt}
            onChange={(e) =>
              update(
                "scheduledAt",
                e.target.value ? `${e.target.value}:00Z` : "",
              )
            }
            invalid={issues.some((i) => i.field === "scheduledAt")}
            hint="Local input becomes UTC ISO 8601 in the payload"
          />
          <Input
            id="exam-notes"
            label="Notes (optional)"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
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
            {submitting ? "Submitting…" : "Create exam"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
