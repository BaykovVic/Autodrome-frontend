"use client";

import { useState } from "react";
import { ApiError } from "@/api/errors";
import { Button } from "./Button";
import styles from "./ApiErrorView.module.css";

type NormalizedError = {
  title: string;
  message: string;
  code?: string;
  status?: number;
  correlationId?: string;
  timestamp?: string;
  url?: string;
};

function normalize(error: unknown): NormalizedError {
  if (error instanceof ApiError) {
    return {
      title: error.code,
      message: error.message,
      code: error.code,
      status: error.status,
      correlationId: error.correlationId,
      timestamp: error.timestamp,
      url: error.url,
    };
  }
  if (error instanceof Error) {
    return { title: error.name || "Error", message: error.message };
  }
  return { title: "UnknownError", message: String(error) };
}

type Props = {
  error: unknown;
  onRetry?: () => void;
  /** Optional override of the retry button label. */
  retryLabel?: string;
};

export function ApiErrorView({
  error,
  onRetry,
  retryLabel = "Retry",
}: Props) {
  const info = normalize(error);
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copied" | "failed"
  >("idle");

  async function copyCorrelationId() {
    if (!info.correlationId) return;
    try {
      await navigator.clipboard.writeText(info.correlationId);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <section
      role="alert"
      aria-live="assertive"
      className={styles.panel}
    >
      <header className={styles.header}>
        <span className={styles.code}>{info.title}</span>
        {info.status ? (
          <span className={styles.status}>HTTP {info.status}</span>
        ) : null}
      </header>
      <p className={styles.message}>{info.message}</p>
      {info.correlationId ? (
        <div className={styles.correlationRow}>
          <span className={styles.correlationLabel}>Correlation-Id</span>
          <code className={styles.correlation}>{info.correlationId}</code>
          <Button
            size="sm"
            variant="ghost"
            onClick={copyCorrelationId}
            aria-label="Copy Correlation-Id"
          >
            {copyStatus === "copied"
              ? "Copied"
              : copyStatus === "failed"
                ? "Copy failed"
                : "Copy"}
          </Button>
        </div>
      ) : null}
      {info.timestamp ? (
        <p className={styles.meta}>
          <span className={styles.metaLabel}>at</span>
          {info.timestamp}
        </p>
      ) : null}
      {info.url ? (
        <p className={styles.meta}>
          <span className={styles.metaLabel}>request</span>
          {info.url}
        </p>
      ) : null}
      {onRetry ? (
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
