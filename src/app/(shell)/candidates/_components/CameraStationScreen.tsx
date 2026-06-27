"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  buttonClassName,
  RefreshIcon,
  Skeleton,
} from "@/components";
import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";

import {
  STATION_ACTIVE,
  STATION_TERMINAL,
  type CameraStationScenario,
  type QualityProgressItem,
} from "./consoleCameraStation";
import {
  useConsoleCameraStation,
  type ConsoleCameraStationLoader,
} from "./useConsoleCameraStation";
import {
  createConsoleEnrollmentDispatcher,
  type ConsoleEnrollmentDispatcher,
} from "./liveBiometryEnrollmentLoader";

import styles from "./CameraStationScreen.module.css";

type Props = {
  loader?: ConsoleCameraStationLoader;
  /**
   * Optional dispatcher override. Tests and Storybook stories inject
   * a fake; runtime selects mock (`null`) vs live based on
   * `resolveRuntimeMode()`.
   */
  dispatcher?: ConsoleEnrollmentDispatcher | null;
};

type Override = {
  scenario: CameraStationScenario;
  committed: "retry" | "cancelled" | "done";
};

function CameraIcon({ denied }: { denied: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={
        denied ? styles.deviceIconDenied : styles.deviceIcon
      }
    >
      <path d="M14.5 4h-5L7 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L20 6.5" />
    </svg>
  );
}

function qualityFillClass(tone: QualityProgressItem["tone"]): string {
  switch (tone) {
    case "online":
      return styles.qualityBarFill;
    case "degraded":
      return `${styles.qualityBarFill} ${styles.qualityBarFillDegraded}`;
    case "offline":
    default:
      return `${styles.qualityBarFill} ${styles.qualityBarFillOffline}`;
  }
}

export function CameraStationScreen({ loader, dispatcher }: Props) {
  const state = useConsoleCameraStation(loader);
  const [override, setOverride] = useState<Override | null>(null);
  const [liveError, setLiveError] = useState<unknown | null>(null);

  // Memoize a live dispatcher per mount so retry/cancel/launch share
  // the same active launchId across operator clicks. Tests can
  // inject one explicitly via the `dispatcher` prop; passing `null`
  // forces mock-only behavior even if env says live.
  const liveDispatcher = useMemo<ConsoleEnrollmentDispatcher | null>(() => {
    if (dispatcher !== undefined) return dispatcher;
    if (resolveRuntimeMode() !== "live") return null;
    return createConsoleEnrollmentDispatcher(
      getApiAdapter({ mode: "live" }),
    );
  }, [dispatcher]);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="Web camera station"
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading camera station" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="Web camera station"
      >
        <div className={styles.loadingPad}>
          <ApiErrorView
            error={state.fatalError}
            onRetry={state.reload}
          />
        </div>
      </section>
    );
  }

  if (!state.snapshot) return null;
  const baseSnapshot = state.snapshot;
  // Effective scenario reflects either the loader scenario or a
  // mock-only operator override (retry/cancel/done).
  const effectiveScenario: CameraStationScenario =
    override?.scenario ?? baseSnapshot.scenario;
  const isActive = STATION_ACTIVE.has(effectiveScenario);
  const isTerminal = STATION_TERMINAL.has(effectiveScenario);
  const isPermissionDenied =
    effectiveScenario === "permission-denied";

  const openDisabled =
    !isActive || isPermissionDenied;
  const retryDisabled = isTerminal;
  const cancelDisabled = !isActive;

  const openTitle = isPermissionDenied
    ? "Browser permission was denied — grant it before opening the capture window."
    : isTerminal
      ? "The capture session has already finished — nothing to open."
      : "Open the capture window on the second monitor.";

  const retryTitle = retryDisabled
    ? "The capture session has already finished — nothing to retry."
    : "Re-send the capture command and reset the quality progress.";

  const cancelTitle = cancelDisabled
    ? "The capture session has already finished — nothing to cancel."
    : "Cancel the capture session.";

  const handleRetry = () => {
    if (retryDisabled) return;
    setOverride({ scenario: "ready", committed: "retry" });
    if (liveDispatcher) {
      // Fire-and-forget: keep UI override optimistic; surface
      // dispatch error inline so operator sees backend rejection.
      liveDispatcher.retry("Operator retry from camera station").catch(
        (error) => setLiveError(error),
      );
    }
  };
  const handleCancel = () => {
    if (cancelDisabled) return;
    setOverride({ scenario: "cancelled", committed: "cancelled" });
    if (liveDispatcher) {
      liveDispatcher
        .cancel("Operator cancel from camera station")
        .catch((error) => setLiveError(error));
    }
  };
  const handleDoneFromOpen = () => {
    setOverride({ scenario: "done", committed: "done" });
  };
  const handleOpenCapture = () => {
    if (override?.scenario === "ready") setOverride(null);
    if (!liveDispatcher) return;
    liveDispatcher
      .launchOrResume(
        baseSnapshot.candidateId,
        baseSnapshot.device.id,
        baseSnapshot.candidate,
      )
      .catch((error) => setLiveError(error));
  };

  // Resolve display fields against the override scenario if any.
  const display = override
    ? {
        ...baseSnapshot,
        scenario: override.scenario,
        captureWindow:
          override.scenario === "ready"
            ? {
                kind: "closed" as const,
                label: "Capture queued — open the capture window to resume",
              }
            : override.scenario === "cancelled"
              ? {
                  kind: "cancelled" as const,
                  label: "Operator cancelled capture from the station",
                }
              : override.scenario === "done"
                ? {
                    kind: "done" as const,
                    label: "Capture finished — template sealed on NODE-A2",
                  }
                : baseSnapshot.captureWindow,
        quality:
          override.scenario === "ready"
            ? baseSnapshot.quality.map((q) => ({ ...q, percent: 0 }))
            : baseSnapshot.quality,
      }
    : baseSnapshot;

  const captureHref = `/capture/${display.sessionId}`;

  return (
    <section
      className={styles.screen}
      aria-label="Web camera station"
    >
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/candidates" className={styles.crumbsLink}>
          Candidates registry
        </Link>
        <span aria-hidden="true">›</span>
        <Link
          href={`/candidates/sessions/${display.sessionId}`}
          className={styles.crumbsLink}
        >
          Enrollment session monitor
        </Link>
        <span aria-hidden="true">›</span>
        <span className={styles.crumbsCurrent}>Web camera station</span>
      </nav>
      <h1 className={styles.title}>Camera station — operator PC</h1>
      <p className={styles.subtitle}>
        The console stays the management surface. Capture runs in a
        separate window on the second monitor.
      </p>

      {liveError ? (
        <div
          className={`${styles.committedPanel} ${styles.committedPanelDanger}`}
          role="alert"
        >
          <p className={styles.committedTitle}>
            Live enrollment dispatch failed
          </p>
          <p className={styles.committedDescription}>
            {liveError instanceof Error ? liveError.message : String(liveError)}
          </p>
        </div>
      ) : null}
      {override ? (
        <div
          className={
            override.committed === "cancelled"
              ? `${styles.committedPanel} ${styles.committedPanelDanger}`
              : styles.committedPanel
          }
          role="status"
          aria-live="polite"
        >
          <p className={styles.committedTitle}>
            {override.committed === "retry"
              ? "Capture retry queued"
              : override.committed === "cancelled"
                ? "Capture cancelled"
                : "Capture finished"}
          </p>
          <p className={styles.committedDescription}>
            {override.committed === "retry"
              ? "Quality progress reset. No real getUserMedia / MediaStream / WebRTC runs in this baseline — operator opens the capture window again to resume."
              : override.committed === "cancelled"
                ? "Operator cancelled capture from the station. No real Android command transport / backend orchestration is wired in this baseline."
                : "Template marked as sealed in the local mock. No real biometry inference / template store is wired in this baseline."}
          </p>
        </div>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.card}
          aria-label="Capture control panel"
        >
          <div className={styles.cardCaption}>Capture control</div>
          <div className={styles.deviceRow}>
            <CameraIcon denied={isPermissionDenied} />
            <div className={styles.deviceText}>
              <div className={styles.deviceName}>{display.device.name}</div>
              <div className={styles.deviceMeta}>{display.device.meta}</div>
            </div>
          </div>
          <div
            className={
              display.captureWindow.kind === "open"
                ? styles.windowStatusRow
                : `${styles.windowStatusRow} ${styles.windowStatusRowMuted}`
            }
          >
            <span
              className={
                display.captureWindow.kind === "open"
                  ? styles.windowStatusDot
                  : `${styles.windowStatusDot} ${styles.windowStatusDotMuted}`
              }
              aria-hidden="true"
            />
            <div className={styles.windowStatusText}>
              <div
                className={
                  display.captureWindow.kind === "open"
                    ? styles.windowStatusTitle
                    : `${styles.windowStatusTitle} ${styles.windowStatusTitleMuted}`
                }
              >
                {display.captureWindow.label}
              </div>
              <div className={styles.windowStatusMeta}>
                session {display.sessionId} · candidate {display.candidate}
              </div>
            </div>
          </div>

          <div className={styles.cardCaption}>Quality progress</div>
          <div
            className={styles.qualityList}
            aria-label="Capture quality progress"
          >
            {display.quality.map((q) => (
              <div key={q.id} className={styles.qualityRow}>
                <span className={styles.qualityLabel}>{q.label}</span>
                <div
                  className={styles.qualityBar}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={q.percent}
                  aria-label={`${q.label} quality`}
                >
                  <div
                    className={qualityFillClass(q.tone)}
                    style={{ width: `${Math.max(0, Math.min(100, q.percent))}%` }}
                  />
                </div>
                <span className={styles.qualityPercent}>{q.percent}%</span>
              </div>
            ))}
          </div>

          <div className={styles.actionsRow}>
            {/*
              Open capture window is a real anchor with `target="_blank"`
              so the operator gets a second browser window the way the
              reference describes — no JS window.open / WebRTC plumbing.
            */}
            {openDisabled ? (
              <Button
                variant="primary"
                size="md"
                type="button"
                disabled
                title={openTitle}
              >
                Open capture window
              </Button>
            ) : (
              // Render as a styled Link so the primary action is a
              // single interactive element — nesting a real
              // `<button>` inside an `<a>` is invalid HTML and breaks
              // keyboard/focus on the wrapper. Visual styling reuses
              // the Button design tokens via `buttonClassName()`.
              <Link
                href={captureHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open capture window in a new browser window"
                title={openTitle}
                className={buttonClassName({
                  variant: "primary",
                  size: "md",
                })}
                onClick={handleOpenCapture}
              >
                Open capture window
              </Link>
            )}
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={handleRetry}
              disabled={retryDisabled}
              title={retryTitle}
            >
              <RefreshIcon />
              Retry
            </Button>
            <Button
              variant="danger"
              size="md"
              type="button"
              onClick={handleCancel}
              disabled={cancelDisabled}
              title={cancelTitle}
            >
              <CancelIcon />
              Cancel
            </Button>
            {effectiveScenario === "capturing" && !override ? (
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={handleDoneFromOpen}
                title="Finalize capture from the station (mock-only)."
              >
                <CheckIcon />
                Done
              </Button>
            ) : null}
          </div>
          {openDisabled || retryDisabled || cancelDisabled ? (
            <p className={styles.actionsNote} role="note">
              {openDisabled
                ? openTitle
                : retryDisabled
                  ? retryTitle
                  : cancelTitle}
            </p>
          ) : null}
        </section>

        <section
          className={styles.previewCard}
          aria-label="Second-monitor preview"
        >
          <div className={styles.previewCaption}>Second monitor</div>
          <div className={styles.previewBox} aria-hidden="true">
            <div className={styles.previewOval} />
            <div className={styles.previewMirrorLabel}>
              PREVIEW MIRROR
            </div>
          </div>
          <p className={styles.previewCopy}>
            The preview is shown to the candidate on the second
            monitor. The operator does not see candidate-facing
            prompts here.
          </p>
        </section>
      </div>
    </section>
  );
}
