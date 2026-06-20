"use client";

import { useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  Input,
  Select,
  StatusBadge,
  ValidationErrors,
  type ValidationIssue,
} from "@/components";
import type { components } from "@/contracts/types/exam";
import type { ExamItem } from "./defaultExamsLoader";
import styles from "./ExamLifecycleActions.module.css";

type ExamFinish = components["schemas"]["ExamFinish"];

type Props = {
  api: AutodromeApi;
  exam: ExamItem;
  onUpdated: (next: ExamItem) => void;
};

type Mode = "idle" | "finish" | "abort";

export function ExamLifecycleActions({ api, exam, onUpdated }: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const [working, setWorking] = useState<null | "start" | "finish" | "abort">(
    null,
  );
  const [error, setError] = useState<unknown | null>(null);

  const [outcome, setOutcome] = useState<ExamFinish["outcome"]>("passed");
  const [score, setScore] = useState<string>("");
  const [finishNotes, setFinishNotes] = useState("");
  const [abortReason, setAbortReason] = useState("");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  const canStart = exam.status === "scheduled";
  const canFinish = exam.status === "inProgress";
  const canAbort = exam.status === "scheduled" || exam.status === "inProgress";

  function resetForms() {
    setOutcome("passed");
    setScore("");
    setFinishNotes("");
    setAbortReason("");
    setIssues([]);
    setError(null);
  }

  async function callStart() {
    setWorking("start");
    setError(null);
    try {
      const { data } = await api.exam.POST("/exams/{examId}/start", {
        params: {
          path: { examId: exam.examId },
          header: { "Idempotency-Key": crypto.randomUUID() },
        },
        body: {},
      });
      if (data) onUpdated(data as ExamItem);
    } catch (caught) {
      setError(caught);
    } finally {
      setWorking(null);
    }
  }

  async function callFinish() {
    const nextIssues: ValidationIssue[] = [];
    if (score && !Number.isFinite(Number(score))) {
      nextIssues.push({
        field: "score",
        message: "Score must be a number",
      });
    }
    setIssues(nextIssues);
    if (nextIssues.length > 0) return;

    setWorking("finish");
    setError(null);
    try {
      const body: ExamFinish = { outcome };
      if (score) body.score = Number(score);
      if (finishNotes.trim()) body.notes = finishNotes.trim();
      const { data } = await api.exam.POST("/exams/{examId}/finish", {
        params: {
          path: { examId: exam.examId },
          header: { "Idempotency-Key": crypto.randomUUID() },
        },
        body,
      });
      if (data) {
        onUpdated(data as ExamItem);
        resetForms();
        setMode("idle");
      }
    } catch (caught) {
      setError(caught);
    } finally {
      setWorking(null);
    }
  }

  async function callAbort() {
    const nextIssues: ValidationIssue[] = [];
    if (!abortReason.trim()) {
      nextIssues.push({ field: "reason", message: "Reason is required" });
    }
    setIssues(nextIssues);
    if (nextIssues.length > 0) return;

    setWorking("abort");
    setError(null);
    try {
      const { data } = await api.exam.POST("/exams/{examId}/abort", {
        params: {
          path: { examId: exam.examId },
          header: { "Idempotency-Key": crypto.randomUUID() },
        },
        body: { reason: abortReason.trim() },
      });
      if (data) {
        onUpdated(data as ExamItem);
        resetForms();
        setMode("idle");
      }
    } catch (caught) {
      setError(caught);
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className={styles.actions} aria-label="Exam lifecycle actions">
      {error ? <ApiErrorView error={error} /> : null}
      {issues.length > 0 ? <ValidationErrors issues={issues} /> : null}

      <div className={styles.buttonRow}>
        <Button
          variant="primary"
          size="sm"
          disabled={!canStart || working !== null}
          onClick={callStart}
        >
          {working === "start" ? "Starting…" : "Start"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canFinish || working !== null}
          onClick={() => {
            resetForms();
            setMode(mode === "finish" ? "idle" : "finish");
          }}
        >
          Finish…
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={!canAbort || working !== null}
          onClick={() => {
            resetForms();
            setMode(mode === "abort" ? "idle" : "abort");
          }}
        >
          Abort…
        </Button>
        {!canStart && !canFinish && !canAbort ? (
          <StatusBadge>
            terminal · no actions
          </StatusBadge>
        ) : null}
      </div>

      {mode === "finish" ? (
        <div className={styles.subForm} aria-label="Finish exam form">
          <Select
            id="finish-outcome"
            label="Outcome"
            value={outcome}
            onChange={(e) =>
              setOutcome(e.target.value as ExamFinish["outcome"])
            }
          >
            <option value="passed">passed</option>
            <option value="failed">failed</option>
          </Select>
          <Input
            id="finish-score"
            label="Score (optional)"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            invalid={issues.some((i) => i.field === "score")}
          />
          <Input
            id="finish-notes"
            label="Notes (optional)"
            value={finishNotes}
            onChange={(e) => setFinishNotes(e.target.value)}
          />
          <div className={styles.subFormFooter}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setMode("idle")}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={working !== null}
              onClick={callFinish}
            >
              {working === "finish" ? "Finishing…" : "Submit finish"}
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "abort" ? (
        <div className={styles.subForm} aria-label="Abort exam form">
          <Input
            id="abort-reason"
            label="Reason"
            required
            value={abortReason}
            onChange={(e) => setAbortReason(e.target.value)}
            invalid={issues.some((i) => i.field === "reason")}
          />
          <div className={styles.subFormFooter}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setMode("idle")}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="button"
              disabled={working !== null}
              onClick={callAbort}
            >
              {working === "abort" ? "Aborting…" : "Submit abort"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
