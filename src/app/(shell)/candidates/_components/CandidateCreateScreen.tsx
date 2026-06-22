"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components";

import { StartEnrollmentDialog } from "./StartEnrollmentDialog";
import type { EnrollmentChannelsSnapshot } from "./consoleEnrollmentChannels";
import { consoleEnrollmentChannelsFor } from "./consoleEnrollmentChannelsFixtures";

import styles from "./CandidateCreateScreen.module.css";

type Eligibility = "approved" | "pending";

type FormState = {
  fullName: string;
  dob: string;
  document: string;
  category: string;
  eligibility: Eligibility;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type Props = {
  /**
   * Optional fixed candidate id to assign on save. Defaults to a
   * deterministic mock id so tests and the design surface stay
   * predictable; live binding lands in a follow-up feature.
   */
  assignedCandidateId?: string;
  /** Optional pre-loaded enrollment-channels snapshot for tests. */
  channels?: EnrollmentChannelsSnapshot;
};

const DEFAULT_FORM: FormState = {
  fullName: "",
  dob: "",
  document: "",
  category: "B",
  eligibility: "approved",
};

const DOB_PATTERN = /^\d{2}\.\d{2}\.\d{4}$/;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.fullName.trim().length < 3) {
    errors.fullName = "Enter the candidate's full name.";
  }
  if (!DOB_PATTERN.test(form.dob.trim())) {
    errors.dob = "Use DD.MM.YYYY (it will be masked in the registry).";
  }
  if (form.document.trim().length < 3) {
    errors.document = "Enter the document or license reference.";
  }
  if (!form.category) {
    errors.category = "Pick an exam category.";
  }
  return errors;
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={styles.infoIcon}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={styles.savedIcon}
    >
      <path d="M5 12.5l4.5 4.5L20 6.5" />
    </svg>
  );
}

export function CandidateCreateScreen({
  assignedCandidateId = "CND-2026-0151",
  channels,
}: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;
  const visibleErrors = submitAttempted ? errors : {};

  const handleChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (saved) setSaved(false);
  };

  const tryCommit = (): boolean => {
    setSubmitAttempted(true);
    if (Object.keys(validate(form)).length > 0) {
      return false;
    }
    setSaved(true);
    return true;
  };

  const handleSave = () => {
    tryCommit();
  };

  const handleSaveAndStart = () => {
    if (tryCommit()) {
      setDialogOpen(true);
    }
  };

  const resolvedChannels: EnrollmentChannelsSnapshot =
    channels ?? consoleEnrollmentChannelsFor("registrar-online");

  return (
    <section
      className={styles.screen}
      aria-label="Create candidate"
    >
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/candidates" className={styles.crumbsLink}>
          Candidates registry
        </Link>
        <span aria-hidden="true">›</span>
        <span className={styles.crumbsCurrent}>New candidate</span>
      </nav>
      <h1 className={styles.title}>Create candidate</h1>

      {saved ? (
        <div
          className={styles.savedBanner}
          role="status"
          aria-live="polite"
        >
          <CheckIcon />
          <div>
            Candidate saved as{" "}
            <span className={styles.assignedIdMono}>
              {assignedCandidateId}
            </span>
            . You can now <strong>Start face enrollment</strong> —
            face capture runs in a separate flow.
          </div>
        </div>
      ) : (
        <div className={styles.infoBanner} role="note">
          <InfoIcon />
          <div>
            Face enrollment is performed separately. First fill in
            and save the required candidate data —{" "}
            <strong>Start enrollment</strong> becomes available
            after a valid save.
          </div>
        </div>
      )}

      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        aria-label="Candidate data"
        noValidate
      >
        <div className={styles.cardSection}>Personal details</div>

        <label className={styles.field}>
          <span
            className={`${styles.fieldLabel} ${styles.fieldLabelRequired}`}
          >
            Full name
          </span>
          <input
            type="text"
            className={
              visibleErrors.fullName
                ? `${styles.fieldInput} ${styles.fieldInputInvalid}`
                : styles.fieldInput
            }
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            aria-invalid={visibleErrors.fullName ? "true" : undefined}
            aria-describedby={
              visibleErrors.fullName ? "fullName-err" : undefined
            }
            autoComplete="off"
          />
          {visibleErrors.fullName ? (
            <span id="fullName-err" className={styles.fieldError}>
              {visibleErrors.fullName}
            </span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span
            className={`${styles.fieldLabel} ${styles.fieldLabelRequired}`}
          >
            Date of birth
          </span>
          <input
            type="text"
            inputMode="numeric"
            className={
              visibleErrors.dob
                ? `${styles.fieldInput} ${styles.fieldInputMono} ${styles.fieldInputInvalid}`
                : `${styles.fieldInput} ${styles.fieldInputMono}`
            }
            value={form.dob}
            placeholder="DD.MM.YYYY"
            onChange={(e) => handleChange("dob", e.target.value)}
            aria-invalid={visibleErrors.dob ? "true" : undefined}
            aria-describedby={
              visibleErrors.dob ? "dob-err" : "dob-hint"
            }
            autoComplete="off"
          />
          {visibleErrors.dob ? (
            <span id="dob-err" className={styles.fieldError}>
              {visibleErrors.dob}
            </span>
          ) : (
            <span id="dob-hint" className={styles.fieldHint}>
              Masked as <code>**.**.YYYY</code> in the registry.
            </span>
          )}
        </label>

        <label className={styles.field}>
          <span
            className={`${styles.fieldLabel} ${styles.fieldLabelRequired}`}
          >
            Document / license
          </span>
          <input
            type="text"
            className={
              visibleErrors.document
                ? `${styles.fieldInput} ${styles.fieldInputMono} ${styles.fieldInputInvalid}`
                : `${styles.fieldInput} ${styles.fieldInputMono}`
            }
            value={form.document}
            placeholder="DL-77-014562"
            onChange={(e) => handleChange("document", e.target.value)}
            aria-invalid={
              visibleErrors.document ? "true" : undefined
            }
            aria-describedby={
              visibleErrors.document ? "document-err" : undefined
            }
            autoComplete="off"
          />
          {visibleErrors.document ? (
            <span id="document-err" className={styles.fieldError}>
              {visibleErrors.document}
            </span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Exam category</span>
          <select
            className={styles.fieldInput}
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
          >
            <option value="A">A — motorcycle</option>
            <option value="B">B — passenger vehicle</option>
            <option value="C">C — heavy vehicle</option>
          </select>
        </label>

        <div
          className={`${styles.cardSection} ${styles.cardSectionDivider}`}
        >
          Eligibility
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Status</span>
          <select
            className={styles.fieldInput}
            value={form.eligibility}
            onChange={(e) =>
              handleChange(
                "eligibility",
                e.target.value as Eligibility,
              )
            }
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending decision</option>
          </select>
        </label>

        <div className={styles.assignedId}>
          Candidate id will be assigned on save:{" "}
          <span className={styles.assignedIdMono}>
            {assignedCandidateId}
          </span>
        </div>
      </form>

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="md"
          type="button"
          onClick={handleSaveAndStart}
          disabled={submitAttempted && hasErrors}
          title={
            submitAttempted && hasErrors
              ? "Resolve form errors first."
              : "Save the candidate, then open the enrollment channel selector."
          }
        >
          Save and start enrollment
        </Button>
        <Button
          variant="secondary"
          size="md"
          type="button"
          onClick={handleSave}
          disabled={submitAttempted && hasErrors}
          title={
            submitAttempted && hasErrors
              ? "Resolve form errors first."
              : "Save the candidate without starting enrollment."
          }
        >
          Save candidate
        </Button>
        <span style={{ flex: 1 }} aria-hidden="true" />
        <Link
          href="/candidates"
          className={styles.cancelLink}
        >
          Cancel
        </Link>
      </div>

      <StartEnrollmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        candidateId={assignedCandidateId}
        candidateName={form.fullName || "—"}
        maskedDob={
          form.dob && DOB_PATTERN.test(form.dob.trim())
            ? `**.**.${form.dob.trim().slice(-4)}`
            : "**.**.****"
        }
        channels={resolvedChannels}
      />
    </section>
  );
}
