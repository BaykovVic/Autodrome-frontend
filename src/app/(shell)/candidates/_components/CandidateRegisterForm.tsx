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
import type { components } from "@/contracts/types/candidate";
import styles from "./CandidateRegisterForm.module.css";

type CandidateRegistration =
  components["schemas"]["CandidateRegistration"];
type IdentityDocument = components["schemas"]["IdentityDocument"];
type Candidate = components["schemas"]["Candidate"];

type FormShape = {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  documentType: IdentityDocument["documentType"];
  documentNumber: string;
  issuedOn: string;
  expiresOn: string;
  externalRegistryId: string;
};

const EMPTY_FORM: FormShape = {
  firstName: "",
  lastName: "",
  middleName: "",
  birthDate: "",
  documentType: "passport",
  documentNumber: "",
  issuedOn: "",
  expiresOn: "",
  externalRegistryId: "",
};

function buildPayload(form: FormShape): CandidateRegistration {
  const document: IdentityDocument = {
    documentType: form.documentType,
    documentNumber: form.documentNumber.trim(),
  };
  if (form.issuedOn) document.issuedOn = form.issuedOn;
  if (form.expiresOn) document.expiresOn = form.expiresOn;

  const payload: CandidateRegistration = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    birthDate: form.birthDate,
    identityDocument: document,
  };
  if (form.middleName.trim()) {
    payload.middleName = form.middleName.trim();
  }
  if (form.externalRegistryId.trim()) {
    payload.externalRegistryId = form.externalRegistryId.trim();
  }
  return payload;
}

function validate(form: FormShape): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!form.firstName.trim()) {
    issues.push({ field: "firstName", message: "First name is required" });
  }
  if (!form.lastName.trim()) {
    issues.push({ field: "lastName", message: "Last name is required" });
  }
  if (!form.birthDate) {
    issues.push({ field: "birthDate", message: "Birth date is required" });
  }
  if (!form.documentNumber.trim()) {
    issues.push({
      field: "identityDocument.documentNumber",
      message: "Document number is required",
    });
  }
  return issues;
}

type Props = {
  api: AutodromeApi;
  open: boolean;
  onClose: () => void;
  onSuccess?: (candidate: Candidate) => void;
};

export function CandidateRegisterForm({
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setSuccessId(null);

    const nextIssues = validate(form);
    setIssues(nextIssues);
    if (nextIssues.length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.candidate.POST("/candidates", {
        params: {
          header: {
            "Idempotency-Key": crypto.randomUUID(),
          },
        },
        body: buildPayload(form),
      });
      const candidate = data as Candidate | undefined;
      if (candidate?.candidateId) {
        setSuccessId(candidate.candidateId);
        setForm(EMPTY_FORM);
        setIssues([]);
        onSuccess?.(candidate);
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
        setIssues([]);
        setServerError(null);
        setSuccessId(null);
        onClose();
      }}
      ariaLabel="Register a new candidate"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <h2 className={styles.title}>Register candidate</h2>
          <p className={styles.subtitle}>
            Payload shape follows
            <span className={styles.mono}> CandidateRegistration</span>
            from candidate-service OpenAPI contract.
          </p>
        </header>

        {issues.length > 0 ? (
          <ValidationErrors issues={issues} />
        ) : null}

        {serverError ? (
          <ApiErrorView error={serverError} />
        ) : null}

        {successId ? (
          <div className={styles.success}>
            <StatusBadge variant="success">created</StatusBadge>
            <span>
              New candidate id <span className={styles.mono}>{successId}</span>
            </span>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Input
            id="firstName"
            label="First name"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            invalid={issues.some((i) => i.field === "firstName")}
          />
          <Input
            id="lastName"
            label="Last name"
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            invalid={issues.some((i) => i.field === "lastName")}
          />
          <Input
            id="middleName"
            label="Middle name (optional)"
            value={form.middleName}
            onChange={(e) => update("middleName", e.target.value)}
          />
          <Input
            id="birthDate"
            type="date"
            label="Birth date"
            required
            value={form.birthDate}
            onChange={(e) => update("birthDate", e.target.value)}
            invalid={issues.some((i) => i.field === "birthDate")}
          />
          <Select
            id="documentType"
            label="Document type"
            value={form.documentType}
            onChange={(e) =>
              update(
                "documentType",
                e.target.value as IdentityDocument["documentType"],
              )
            }
          >
            <option value="passport">passport</option>
            <option value="idCard">idCard</option>
            <option value="drivingLicense">drivingLicense</option>
            <option value="foreignPassport">foreignPassport</option>
          </Select>
          <Input
            id="documentNumber"
            label="Document number"
            required
            value={form.documentNumber}
            onChange={(e) => update("documentNumber", e.target.value)}
            invalid={issues.some(
              (i) => i.field === "identityDocument.documentNumber",
            )}
          />
          <Input
            id="issuedOn"
            type="date"
            label="Issued on (optional)"
            value={form.issuedOn}
            onChange={(e) => update("issuedOn", e.target.value)}
          />
          <Input
            id="expiresOn"
            type="date"
            label="Expires on (optional)"
            value={form.expiresOn}
            onChange={(e) => update("expiresOn", e.target.value)}
          />
          <Input
            id="externalRegistryId"
            label="External registry id (optional)"
            value={form.externalRegistryId}
            onChange={(e) => update("externalRegistryId", e.target.value)}
            hint="Reference only — not used as primary key."
          />
        </div>

        <footer className={styles.footer}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              setIssues([]);
              setServerError(null);
              setSuccessId(null);
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
            {submitting ? "Submitting…" : "Register"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
