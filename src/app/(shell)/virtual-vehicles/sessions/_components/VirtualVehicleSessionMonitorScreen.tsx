"use client";

import Link from "next/link";

import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  useConsoleVirtualVehicleSessionMonitor,
  type ConsoleVirtualVehicleSessionMonitorLoader,
} from "./useConsoleVirtualVehicleSessionMonitor";
import type {
  ConsoleSessionEventSeverity,
  ConsoleSessionRuntimeCard,
  ConsoleSessionState,
} from "./consoleVirtualVehicleSessionMonitorSnapshot";
import styles from "./VirtualVehicleSessionMonitorScreen.module.css";

type Props = {
  sessionId: string;
  loader?: ConsoleVirtualVehicleSessionMonitorLoader;
};

function stateDot(state: ConsoleSessionState): StatusDotVariant {
  switch (state) {
    case "running":
      return "online";
    case "paused":
      return "standby";
    case "starting":
      return "standby";
    case "degraded":
      return "degraded";
    case "stopped":
    case "unknown":
    default:
      return "offline";
  }
}

function stateBadge(state: ConsoleSessionState): StatusBadgeVariant {
  switch (state) {
    case "running":
      return "success";
    case "paused":
      return "info";
    case "starting":
      return "info";
    case "degraded":
      return "warning";
    case "stopped":
      return "neutral";
    case "unknown":
    default:
      return "neutral";
  }
}

function cardClass(
  variant: ConsoleSessionRuntimeCard["variant"],
): string {
  switch (variant) {
    case "info":
      return `${styles.card} ${styles.cardInfo}`;
    case "success":
      return `${styles.card} ${styles.cardSuccess}`;
    case "warning":
      return `${styles.card} ${styles.cardWarning}`;
    case "danger":
      return `${styles.card} ${styles.cardDanger}`;
    case "neutral":
    default:
      return `${styles.card} ${styles.cardNeutral}`;
  }
}

function severityDot(
  severity: ConsoleSessionEventSeverity,
): StatusDotVariant {
  switch (severity) {
    case "info":
      return "online";
    case "warning":
      return "degraded";
    case "error":
      return "offline";
    case "telemetry":
    default:
      return "standby";
  }
}

export function VirtualVehicleSessionMonitorScreen({
  sessionId,
  loader,
}: Props) {
  const state = useConsoleVirtualVehicleSessionMonitor(sessionId, loader);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label={`Virtual vehicle session ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading session monitor" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label={`Virtual vehicle session ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const session = state.snapshot;
  if (!session) {
    return (
      <section
        className={styles.screen}
        aria-label={`Virtual vehicle session ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <EmptyState
            title="Session not found"
            description="No fixture or live snapshot returned for this session id."
          />
        </div>
      </section>
    );
  }

  const isRunning = session.state === "running";
  const isPaused = session.state === "paused";
  const isStopped = session.state === "stopped";
  const liveTooltip =
    "Live command flow lands with the upcoming virtual-vehicle live API integration feature.";

  return (
    <section
      className={styles.screen}
      aria-label={`Virtual vehicle session ${session.sessionId}`}
    >
      <header className={styles.header}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/virtual-vehicles" className={styles.crumbsLink}>
            Virtual Vehicles
          </Link>
          <span aria-hidden="true">›</span>
          <span className={styles.crumbsCurrent}>
            Session · {session.sessionId}
          </span>
          <span aria-hidden="true">·</span>
          <Link
            href={`/virtual-vehicles/sessions/${session.sessionId}/manual-control`}
            className={styles.crumbsLink}
          >
            Manual control →
          </Link>
        </nav>
        <div className={styles.titleRow}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{session.sessionId}</h1>
            <p className={styles.subtitle}>
              {session.vehicleLabel} · {session.sourceLabel} (
              {session.source}) · scenario{" "}
              <strong>{session.scenarioId}</strong>{" "}
              ({session.scenarioLabel})
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <StatusDot
                variant={stateDot(session.state)}
                halo={false}
              />
              <StatusBadge variant={stateBadge(session.state)}>
                {session.stateLabel}
              </StatusBadge>
            </span>
          </div>
          <div
            className={styles.commandRow}
            role="group"
            aria-label="Session command affordances"
          >
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled
              title={
                isRunning
                  ? "Session is already running."
                  : isStopped
                    ? "Session is stopped; a fresh session needs to be spawned."
                    : liveTooltip
              }
            >
              Start
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled
              title={
                isRunning
                  ? liveTooltip
                  : "Session is not running — pause is unavailable."
              }
            >
              Pause
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled
              title={
                isPaused
                  ? liveTooltip
                  : "Session is not paused — resume is unavailable."
              }
            >
              Resume
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled
              title={
                isStopped
                  ? "Session is already stopped."
                  : liveTooltip
              }
            >
              Stop
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="session-monitor-runtime-cards-title"
        >
          <h2
            id="session-monitor-runtime-cards-title"
            className={styles.sectionTitle}
          >
            Runtime status
          </h2>
          {session.runtimeCards.length === 0 ? (
            <p className={styles.notesText}>
              No runtime telemetry available for this session.
            </p>
          ) : (
            <div className={styles.cards}>
              {session.runtimeCards.map((card) => (
                <div
                  key={card.id}
                  className={cardClass(card.variant)}
                  role="group"
                  aria-label={card.title}
                >
                  <span className={styles.cardTitle}>{card.title}</span>
                  <span className={styles.cardValue}>{card.value}</span>
                  {card.canonical ? (
                    <span className={styles.cardCanonical}>
                      ({card.canonical})
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="session-monitor-event-log-title"
        >
          <h2
            id="session-monitor-event-log-title"
            className={styles.sectionTitle}
          >
            Event log
          </h2>
          {session.events.length === 0 ? (
            <p className={styles.notesText}>
              No events recorded yet for this session.
            </p>
          ) : (
            <ul
              className={styles.eventList}
              aria-label="Session event log"
            >
              {session.events.map((ev) => (
                <li key={ev.id} className={styles.eventRow}>
                  <span className={styles.eventTime}>{ev.at}</span>
                  <span className={styles.eventSeverity}>
                    <StatusDot
                      variant={severityDot(ev.severity)}
                      halo={false}
                    />
                    {ev.severityLabel}
                  </span>
                  <span className={styles.eventBody}>
                    <span className={styles.eventLabel}>
                      {ev.label}{" "}
                      <span className={styles.eventCanonical}>
                        ({ev.kind})
                      </span>
                    </span>
                    <span className={styles.eventDetail}>
                      {ev.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {session.notes ? (
          <section
            className={styles.section}
            aria-labelledby="session-monitor-notes-title"
          >
            <h2
              id="session-monitor-notes-title"
              className={styles.sectionTitle}
            >
              Operator notes
            </h2>
            <p className={styles.notesText}>{session.notes}</p>
          </section>
        ) : null}
      </div>
    </section>
  );
}
