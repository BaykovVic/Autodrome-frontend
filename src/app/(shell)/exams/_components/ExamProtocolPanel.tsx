"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";
import {
  Button,
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components";
import {
  liveExamProtocolRequest,
  liveReportingLoader,
  type ConsoleProtocolRequestResult,
} from "@/app/(shell)/reporting/_components/liveReportingLoader";
import type { ConsoleReportingTemplate } from "@/app/(shell)/reporting/_components/consoleReportingSnapshot";
import { consoleReportingFor } from "@/app/(shell)/reporting/_components/consoleReportingFixtures";

import styles from "./ExamProtocolPanel.module.css";

type Props = {
  examId: string;
  canGenerate: boolean;
  templatesLoader?: () =>
    | Promise<ConsoleReportingTemplate[]>
    | ConsoleReportingTemplate[];
  generator?: (
    templateId: string,
  ) =>
    | Promise<ConsoleProtocolRequestResult>
    | ConsoleProtocolRequestResult;
};

async function defaultTemplatesLoader(): Promise<
  ConsoleReportingTemplate[]
> {
  if (resolveRuntimeMode() === "live") {
    const snapshot = await liveReportingLoader(
      getApiAdapter({ mode: "live" }),
    );
    return snapshot.templates;
  }
  return consoleReportingFor("normal").templates;
}

function defaultGenerator(examId: string) {
  return async (
    templateId: string,
  ): Promise<ConsoleProtocolRequestResult> => {
    if (resolveRuntimeMode() === "live") {
      return liveExamProtocolRequest(
        getApiAdapter({ mode: "live" }),
        examId,
        {
          format: "pdf",
          templateRef: { templateId, templateVersion: 1 },
        },
      );
    }
    // Mock generator: returns a synthetic ready result so the
    // panel demonstrates layout without any real backend wiring.
    return {
      reportId: `REP-${examId}-MOCK`,
      examId,
      status: "ready",
      statusLabel: "Ready",
      degraded: false,
      missingEvidence: [],
      snapshotHash: "sha256:mock",
      violationCount: 2,
      mediaCount: 3,
      audioCount: 1,
      biometryCount: 1,
      generatedAt: "2026-06-28T09:50:00Z",
    };
  };
}

function resultBadgeVariant(
  result: ConsoleProtocolRequestResult,
): StatusBadgeVariant {
  if (result.degraded) return "warning";
  if (result.status === "ready") return "success";
  if (result.status === "failed") return "danger";
  return "neutral";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function ExamProtocolPanel({
  examId,
  canGenerate,
  templatesLoader,
  generator,
}: Props) {
  const [templates, setTemplates] =
    useState<ConsoleReportingTemplate[] | null>(null);
  const [templateError, setTemplateError] = useState<unknown | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] =
    useState<ConsoleProtocolRequestResult | null>(null);
  const [generateError, setGenerateError] = useState<unknown | null>(null);

  const effectiveTemplatesLoader = useMemo(
    () => templatesLoader ?? defaultTemplatesLoader,
    [templatesLoader],
  );
  const effectiveGenerator = useMemo(
    () => generator ?? defaultGenerator(examId),
    [generator, examId],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await effectiveTemplatesLoader();
        if (cancelled) return;
        setTemplates(list);
        if (list.length > 0) setSelectedTemplate(list[0].templateId);
      } catch (error) {
        if (cancelled) return;
        setTemplateError(error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [effectiveTemplatesLoader]);

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate || !canGenerate || generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const r = await effectiveGenerator(selectedTemplate);
      setResult(r);
    } catch (error) {
      setGenerateError(error);
    } finally {
      setGenerating(false);
    }
  }, [
    selectedTemplate,
    canGenerate,
    generating,
    effectiveGenerator,
  ]);

  const generateTitle = canGenerate
    ? "Compose an exam protocol with the selected template (POST /reports/exams/{id}/protocol)."
    : "Protocol generation is available after the exam result is calculated.";

  return (
    <div className={styles.panel} aria-label={`Exam ${examId} protocol`}>
      <div className={styles.actions}>
        {templates === null && !templateError ? (
          <span className={styles.absent}>Loading templates…</span>
        ) : templateError ? (
          <span className={styles.error}>
            Templates failed: {errorMessage(templateError)}
          </span>
        ) : templates && templates.length > 0 ? (
          <label className={styles.row}>
            <span className={styles.label}>Template</span>
            <select
              className={styles.select}
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              aria-label="Protocol template"
            >
              {templates.map((t) => (
                <option key={t.templateId} value={t.templateId}>
                  {t.name} · v{t.version}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className={styles.absent}>No templates published.</span>
        )}
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={() => {
            void handleGenerate();
          }}
          disabled={
            !canGenerate ||
            generating ||
            !selectedTemplate ||
            !templates ||
            templates.length === 0
          }
          title={generateTitle}
        >
          {generating ? "Generating…" : "Generate protocol"}
        </Button>
      </div>

      {generateError ? (
        <p className={styles.error} role="alert">
          Generate failed: {errorMessage(generateError)}
        </p>
      ) : null}

      {result ? (
        <div className={styles.summary} role="status" aria-live="polite">
          <div className={styles.row}>
            <StatusBadge variant={resultBadgeVariant(result)}>
              {result.degraded
                ? "Degraded result"
                : result.statusLabel}
            </StatusBadge>
            <Link
              href={`/evidence/${result.reportId}`}
              className={styles.link}
              aria-label={`Open generated report ${result.reportId}`}
            >
              {result.reportId} →
            </Link>
          </div>
          <dl className={styles.metaGrid}>
            <div>
              <span className={styles.label}>Snapshot</span>{" "}
              <span className={styles.value}>{result.snapshotHash}</span>
            </div>
            <div>
              <span className={styles.label}>Generated</span>{" "}
              <span className={styles.value}>{result.generatedAt}</span>
            </div>
            <div>
              <span className={styles.label}>Violations</span>{" "}
              <span className={styles.value}>{result.violationCount}</span>
            </div>
            <div>
              <span className={styles.label}>Media</span>{" "}
              <span className={styles.value}>{result.mediaCount}</span>
            </div>
            <div>
              <span className={styles.label}>Audio</span>{" "}
              <span className={styles.value}>{result.audioCount}</span>
            </div>
            <div>
              <span className={styles.label}>Biometry</span>{" "}
              <span className={styles.value}>{result.biometryCount}</span>
            </div>
          </dl>
          {result.missingEvidence.length > 0 ? (
            <div>
              <span className={styles.label}>Missing evidence</span>
              <ul
                className={styles.missingList}
                aria-label="Missing evidence references"
              >
                {result.missingEvidence.map((m) => (
                  <li key={m} className={styles.missingChip}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
