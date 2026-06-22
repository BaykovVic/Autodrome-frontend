"use client";

import { useState } from "react";
import { ApiError } from "@/api/errors";
import {
  classifyError,
  type ApiErrorCategory,
} from "@/api/error-taxonomy";
import { Button } from "./Button";
import styles from "./ApiErrorView.module.css";

type NormalizedError = {
  /** Raw error code (`ApiError.code` or `Error.name`). */
  title: string;
  /** Raw error message (operator-facing primary text). */
  message: string;
  /** Resolved taxonomy category. */
  category: ApiErrorCategory;
  /** Operator-facing category hint shown under the raw message. */
  categoryHint: string;
  /** Raw HTTP status if available. */
  status?: number;
  correlationId?: string;
  timestamp?: string;
  url?: string;
};

function normalize(error: unknown): NormalizedError {
  const classified = classifyError(error);
  if (error instanceof ApiError) {
    return {
      title: error.code,
      message: error.message,
      category: classified.category,
      categoryHint: classified.description,
      status: error.status,
      correlationId: error.correlationId,
      timestamp: error.timestamp,
      url: error.url,
    };
  }
  if (error instanceof Error) {
    return {
      title: error.name || "Error",
      message: error.message,
      category: classified.category,
      categoryHint: classified.description,
    };
  }
  return {
    title: classified.title,
    message: String(error),
    category: classified.category,
    categoryHint: classified.description,
  };
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
        {info.category !== "unknown" ? (
          <span
            className={styles.status}
            data-category={info.category}
            aria-label={`Error category ${info.category}`}
          >
            {info.category}
          </span>
        ) : null}
      </header>
      <p className={styles.message}>{info.message}</p>
      <p className={styles.message} data-role="category-hint">
        {info.categoryHint}
      </p>
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
