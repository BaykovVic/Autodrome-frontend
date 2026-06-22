"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  RefreshIcon,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";

import {
  CANCEL_ELIGIBLE,
  RETRY_ELIGIBLE,
  TERMINAL_STATES,
  type EnrollmentSession,
  type EnrollmentSessionState,
  type EnrollmentSessionTimelineEntry,
} from "./consoleEnrollmentSession";
import {
  cancelAppendedTimeline,
  retryAppendedTimeline,
} from "./consoleEnrollmentSessionFixtures";
import {
  useConsoleEnrollmentSession,
  type ConsoleEnrollmentSessionLoader,
} from "./useConsoleEnrollmentSession";

import styles from "./EnrollmentSessionMonitor.module.css";

type Props = {
  loader?: ConsoleEnrollmentSessionLoader;
};

type Override = {
  state: EnrollmentSessionState;
  stateLabel: string;
  ttl: string;
  lastEventAt: string;
  timeline: EnrollmentSessionTimelineEntry[];
  committed: "retry" | "cancel";
};

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

function stateBadgeVariant(
  state: EnrollmentSessionState,
): StatusBadgeVariant {
  switch (state) {
    case "queued":
    case "accepted":
      return "info";
    case "capturing":
      return "info";
    case "ttl-warning":
      return "warning";
    case "quality-failed":
      return "danger";
    case "finalized":
      return "success";
    case "expired":
    case "cancelled":
    default:
      return "neutral";
  }
}

function stateDot(state: EnrollmentSessionState): StatusDotVariant {
  switch (state) {
    case "queued":
    case "accepted":
      return "standby";
    case "capturing":
      return "online";
    case "ttl-warning":
      return "degraded";
    case "quality-failed":
      return "offline";
    case "finalized":
      return "online";
    case "expired":
    case "cancelled":
    default:
      return "offline";
  }
}

export function EnrollmentSessionMonitor({ loader }: Props) {
  const state = useConsoleEnrollmentSession(loader);
  const [override, setOverride] = useState<Override | null>(null);

  const baseSession = state.snapshot?.session;
  const session: EnrollmentSession | null = useMemo(() => {
    if (!baseSession) return null;
    if (!override) return baseSession;
    return {
      ...baseSession,
      state: override.state,
      stateLabel: override.stateLabel,
      ttl: override.ttl,
      lastEventAt: override.lastEventAt,
      timeline: override.timeline,
    };
  }, [baseSession, override]);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="Enrollment session monitor"
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading enrollment session" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="Enrollment session monitor"
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

  if (!session) {
    return null;
  }

  const isTerminal = TERMINAL_STATES.has(session.state);
  const canRetry = RETRY_ELIGIBLE.has(session.state);
  const canCancel = CANCEL_ELIGIBLE.has(session.state);

  const retryDisabledReason = !canRetry
    ? isTerminal
      ? "The session has already reached a terminal state — nothing to retry."
      : "Retry is only available when the session is queued, in TTL warning, or has failed quality."
    : "";
  const cancelDisabledReason = !canCancel
    ? "The session has already reached a terminal state — nothing to cancel."
    : "";

  const handleRetry = () => {
    if (!canRetry || !session) return;
    setOverride({
      state: "queued",
      stateLabel: "Queued · retry",
      ttl: "04:55",
      lastEventAt: "—",
      timeline: retryAppendedTimeline(session.timeline),
      committed: "retry",
    });
  };

  const handleCancel = () => {
    if (!canCancel || !session) return;
    setOverride({
      state: "cancelled",
      stateLabel: "Cancelled",
      ttl: "—",
      lastEventAt: "—",
      timeline: cancelAppendedTimeline(session.timeline),
      committed: "cancel",
    });
  };

  return (
    <section
      className={styles.screen}
      aria-label="Enrollment session monitor"
    >
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/candidates" className={styles.crumbsLink}>
          Candidates registry
        </Link>
        <span aria-hidden="true">›</span>
        <span className={styles.crumbsCurrent}>
          Enrollment session monitor
        </span>
      </nav>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>Enrollment session</h1>
        <span className={styles.sessionId}>{session.id}</span>
        <span className={styles.stateBadgeWrap}>
          <StatusDot variant={stateDot(session.state)} halo={false} />
          <StatusBadge variant={stateBadgeVariant(session.state)}>
            {session.stateLabel}
          </StatusBadge>
        </span>
        <span className={styles.spacer} aria-hidden="true" />
        <span
          className={
            isTerminal ? `${styles.ttl} ${styles.ttlMuted}` : styles.ttl
          }
        >
          TTL {session.ttl}
        </span>
      </div>

      {override ? (
        <div
          className={
            override.committed === "cancel"
              ? `${styles.committedPanel} ${styles.committedPanelDanger}`
              : styles.committedPanel
          }
          role="status"
          aria-live="polite"
        >
          <p className={styles.committedTitle}>
            {override.committed === "retry"
              ? "Retry queued in the local mock"
              : "Session cancelled in the local mock"}
          </p>
          <p className={styles.committedDescription}>
            {override.committed === "retry"
              ? "The retry was appended to the audit timeline. No real Android command transport is wired in this baseline — the next state will arrive once backend orchestration ships."
              : "The cancellation was appended to the audit timeline. No real Android command transport is wired in this baseline — backend orchestration will commit the cancellation when it ships."}
          </p>
        </div>
      ) : null}

      <div className={styles.body}>
        <section className={styles.card} aria-label="Session facts">
          <div className={styles.cardCaption}>Session</div>
          <dl className={styles.factsGrid}>
            <div className={styles.factRow}>
              <dt className={styles.factLabel}>Candidate</dt>
              <dd className={styles.factValue}>{session.candidate}</dd>
              <p className={styles.factSubtle}>
                <span className={styles.factValueMono}>
                  {session.candidateId}
                </span>
              </p>
            </div>
            <div className={styles.factRow}>
              <dt className={styles.factLabel}>Channel</dt>
              <dd className={styles.factValue}>{session.channelLabel}</dd>
            </div>
            <div className={styles.factRow}>
              <dt className={styles.factLabel}>Target device</dt>
              <dd className={styles.factValueMono}>{session.targetDevice}</dd>
              <p className={styles.factSubtle}>{session.deviceStation}</p>
            </div>
            <div className={styles.factRow}>
              <dt className={styles.factLabel}>Last event</dt>
              <dd className={styles.factValueMono}>{session.lastEventAt}</dd>
            </div>
          </dl>
          <div className={styles.actionsRow}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleRetry}
              disabled={!canRetry}
              title={
                canRetry
                  ? "Re-send the enrollment command and reset the audit timeline."
                  : retryDisabledReason
              }
            >
              <RefreshIcon />
              Retry
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="button"
              onClick={handleCancel}
              disabled={!canCancel}
              title={
                canCancel
                  ? "Cancel the current enrollment session."
                  : cancelDisabledReason
              }
            >
              <CancelIcon />
              Cancel session
            </Button>
          </div>
          {!canRetry || !canCancel ? (
            <p className={styles.actionsNote} role="note">
              {!canRetry
                ? retryDisabledReason
                : cancelDisabledReason}
            </p>
          ) : null}
        </section>

        <section
          className={styles.card}
          aria-label="Session timeline · audit"
        >
          <div className={styles.cardCaption}>
            Timeline · audit
          </div>
          <ul className={styles.timelineList}>
            {session.timeline.map((entry, idx) => {
              const isLast = idx === session.timeline.length - 1;
              return (
                <li key={entry.id} className={styles.timelineItem}>
                  <span className={styles.timelineRail} aria-hidden="true">
                    <StatusDot variant={entry.tone} halo={false} />
                    {isLast ? null : (
                      <span className={styles.timelineLine} />
                    )}
                  </span>
                  <div className={styles.timelineBody}>
                    <div className={styles.timelineLabel}>{entry.label}</div>
                    <div className={styles.timelineNote}>{entry.note}</div>
                    <div className={styles.timelineTime}>{entry.time}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </section>
  );
}
