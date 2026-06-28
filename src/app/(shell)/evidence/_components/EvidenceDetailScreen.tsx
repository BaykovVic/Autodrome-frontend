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
  EVIDENCE_MEDIA_SOURCE_LABELS,
  type ConsoleEvidenceDetail,
  type ConsoleEvidenceMediaRecordingStatus,
  type ConsoleEvidenceMediaRef,
  type ConsoleEvidenceReportStatus,
} from "./consoleEvidenceSnapshot";
import {
  aggregateDetailPlaybackStates,
  assessPlayback,
  PLAYBACK_STATE_LABELS,
} from "./evidencePlaybackState";
import {
  useConsoleEvidenceDetail,
  type ConsoleEvidenceDetailLoader,
} from "./useConsoleEvidenceDetail";
import styles from "./EvidenceDetailScreen.module.css";

type Props = {
  evidenceId: string;
  loader?: ConsoleEvidenceDetailLoader;
};

function mediaStatusBadge(
  s: ConsoleEvidenceMediaRecordingStatus,
): StatusBadgeVariant {
  switch (s) {
    case "finalized":
      return "success";
    case "active":
      return "info";
    case "failed":
      return "danger";
    case "unknown":
    default:
      return "neutral";
  }
}

function mediaStatusDot(
  s: ConsoleEvidenceMediaRecordingStatus,
): StatusDotVariant {
  switch (s) {
    case "finalized":
      return "online";
    case "active":
      return "standby";
    case "failed":
      return "offline";
    case "unknown":
    default:
      return "offline";
  }
}

function reportStatusBadge(
  s: ConsoleEvidenceReportStatus,
): StatusBadgeVariant {
  switch (s) {
    case "ready":
      return "success";
    case "generating":
      return "info";
    case "failed":
      return "danger";
    case "unknown":
    default:
      return "neutral";
  }
}

function reportStatusDot(
  s: ConsoleEvidenceReportStatus,
): StatusDotVariant {
  switch (s) {
    case "ready":
      return "online";
    case "generating":
      return "standby";
    case "failed":
      return "offline";
    case "unknown":
    default:
      return "offline";
  }
}

export function EvidenceDetailScreen({ evidenceId, loader }: Props) {
  const state = useConsoleEvidenceDetail(evidenceId, loader);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label={`Evidence ${evidenceId} detail`}
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading evidence detail" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label={`Evidence ${evidenceId} detail`}
      >
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const detail = state.snapshot;
  if (!detail) {
    return (
      <section
        className={styles.screen}
        aria-label={`Evidence ${evidenceId} detail`}
      >
        <div className={styles.loadingPad}>
          <EmptyState
            title="Evidence not found"
            description="No detail snapshot returned for this evidence id."
          />
        </div>
      </section>
    );
  }

  return renderDetail(detail);
}

function renderDetail(detail: ConsoleEvidenceDetail) {
  const { evidence } = detail;
  const playbackUnavailableReason =
    "Playback не доступен в этом релизе: feature " +
    "`frontend-media-playback-degraded-states` ещё не shipped.";
  const exportUnavailableReason =
    "Export не доступен в этом релизе: feature " +
    "`frontend-reporting-live-api-integration` ещё не shipped.";

  return (
    <section
      className={styles.screen}
      aria-label={`Evidence ${evidence.id} detail`}
    >
      <header className={styles.header}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/evidence" className={styles.crumbsLink}>
            Evidence
          </Link>
          <span aria-hidden="true">›</span>
          <span className={styles.crumbsCurrent}>{evidence.id}</span>
        </nav>
        <h1 className={styles.title}>{evidence.id}</h1>
        <p className={styles.subtitle}>
          Exam <strong>{evidence.examId}</strong> · type{" "}
          <strong>{evidence.typeLabel}</strong>{" "}
          <span style={{ fontFamily: "var(--font-family-mono)" }}>
            ({evidence.type})
          </span>{" "}
          · captured at <strong>{evidence.captured}</strong>
        </p>
      </header>

      <p
        className={styles.unavailableBanner}
        role="status"
        aria-label="Playback and export availability"
      >
        Playback and export are intentionally disabled in this view
        until the dedicated features ship.
      </p>

      {detail.mediaRefs.length > 0 ? (
        <div
          className={styles.aggregateStates}
          role="group"
          aria-label="Aggregate playback state taxonomy"
        >
          {aggregateDetailPlaybackStates(detail.mediaRefs).map((s) => (
            <span key={s} className={styles.playbackPill}>
              {PLAYBACK_STATE_LABELS[s]}{" "}
              <span className={styles.playbackPillCanonical}>({s})</span>
            </span>
          ))}
        </div>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="evidence-detail-meta-title"
        >
          <h2
            id="evidence-detail-meta-title"
            className={styles.sectionTitle}
          >
            Evidence metadata
          </h2>
          <dl className={styles.metaGrid}>
            <dt className={styles.metaLabel}>Type</dt>
            <dd className={styles.metaValue}>
              {evidence.typeLabel} ({evidence.type})
            </dd>
            <dt className={styles.metaLabel}>Status</dt>
            <dd className={styles.metaValue}>{evidence.statusLabel}</dd>
            <dt className={styles.metaLabel}>Captured</dt>
            <dd className={styles.metaValue}>{evidence.captured}</dd>
            <dt className={styles.metaLabel}>Size</dt>
            <dd className={styles.metaValue}>{evidence.size}</dd>
            <dt className={styles.metaLabel}>SHA-256</dt>
            <dd className={styles.metaValue}>{evidence.sha256}</dd>
          </dl>
          {detail.notes ? (
            <p className={styles.notesText}>
              <strong>Operator notes:</strong> {detail.notes}
            </p>
          ) : null}
        </section>

        <section
          className={styles.section}
          aria-labelledby="evidence-detail-actions-title"
        >
          <h2
            id="evidence-detail-actions-title"
            className={styles.sectionTitle}
          >
            Actions
          </h2>
          <div
            className={styles.actionsRow}
            role="group"
            aria-label="Evidence actions"
          >
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled
              title={playbackUnavailableReason}
            >
              Playback (unavailable)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled
              title={exportUnavailableReason}
            >
              Export (unavailable)
            </Button>
          </div>
          <p className={styles.notesText}>{playbackUnavailableReason}</p>
          <p className={styles.notesText}>{exportUnavailableReason}</p>
        </section>

        <section
          className={`${styles.section} ${styles.sectionFull}`}
          aria-labelledby="evidence-detail-media-title"
        >
          <h2
            id="evidence-detail-media-title"
            className={styles.sectionTitle}
          >
            Media refs ({detail.mediaRefs.length})
          </h2>
          {detail.mediaRefs.length === 0 ? (
            <p className={styles.notesText}>
              No linked media recordings.
            </p>
          ) : (
            <ul className={styles.refList} aria-label="Media refs">
              {detail.mediaRefs.map((ref: ConsoleEvidenceMediaRef) => {
                const playback = assessPlayback(ref);
                return (
                <li key={ref.recordingId} className={styles.refCard}>
                  <div className={styles.refTopRow}>
                    <span className={styles.refId}>{ref.recordingId}</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <StatusDot
                        variant={mediaStatusDot(ref.status)}
                        halo={false}
                      />
                      <StatusBadge variant={mediaStatusBadge(ref.status)}>
                        {ref.statusLabel}
                      </StatusBadge>
                    </span>
                  </div>
                  <span
                    className={styles.playbackPill}
                    role="status"
                    aria-label={`Playback state for ${ref.recordingId}`}
                  >
                    {playback.label}{" "}
                    <span className={styles.playbackPillCanonical}>
                      ({playback.state})
                    </span>
                  </span>
                  <p className={styles.playbackReason}>
                    {playback.reason}
                  </p>
                  <span className={styles.refMeta}>
                    Sources:{" "}
                    {ref.sources.length === 0
                      ? "—"
                      : ref.sources
                          .map(
                            (s) =>
                              `${EVIDENCE_MEDIA_SOURCE_LABELS[s]} (${s})`,
                          )
                          .join(" · ")}
                  </span>
                  <span className={styles.refMeta}>
                    Segments: {ref.segmentCount} · Manifest expires:{" "}
                    {ref.manifestExpiresAt}
                  </span>
                  {ref.manifestError ? (
                    <p
                      className={styles.refError}
                      aria-label={`Manifest error for ${ref.recordingId}`}
                    >
                      {ref.manifestError}
                    </p>
                  ) : null}
                  {ref.segments && ref.segments.length > 0 ? (
                    <div>
                      <p className={styles.subSectionTitle}>
                        Segments
                      </p>
                      <table
                        className={styles.segmentTable}
                        aria-label={`Segments for ${ref.recordingId}`}
                      >
                        <thead>
                          <tr>
                            <th>Segment</th>
                            <th>Source</th>
                            <th>Started</th>
                            <th>Ended</th>
                            <th>Checksum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ref.segments.map((s) => (
                            <tr key={s.segmentId}>
                              <td>{s.segmentId}</td>
                              <td>
                                {s.sourceLabel}{" "}
                                <span
                                  style={{
                                    color: "var(--color-text-subtle)",
                                  }}
                                >
                                  ({s.source})
                                </span>
                              </td>
                              <td>{s.startedAt}</td>
                              <td>{s.endedAt}</td>
                              <td>{s.checksumShort}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {ref.timeline && ref.timeline.length > 0 ? (
                    <div>
                      <p className={styles.subSectionTitle}>
                        Timeline mapping
                      </p>
                      <table
                        className={styles.segmentTable}
                        aria-label={`Timeline for ${ref.recordingId}`}
                      >
                        <thead>
                          <tr>
                            <th>From</th>
                            <th>To</th>
                            <th>Source</th>
                            <th>Segment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ref.timeline.map((t, idx) => (
                            <tr key={`${t.segmentId}-${idx}`}>
                              <td>{t.timelineFrom}</td>
                              <td>{t.timelineTo}</td>
                              <td>
                                {t.sourceLabel}{" "}
                                <span
                                  style={{
                                    color: "var(--color-text-subtle)",
                                  }}
                                >
                                  ({t.source})
                                </span>
                              </td>
                              <td>{t.segmentId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </li>
                );
              })}
            </ul>
          )}
        </section>

        {detail.examMediaIndex ? (
          <section
            className={`${styles.section} ${styles.sectionFull}`}
            aria-labelledby="evidence-detail-exam-media-title"
          >
            <h2
              id="evidence-detail-exam-media-title"
              className={styles.sectionTitle}
            >
              Exam media index ({detail.examMediaIndex.recordings.length})
            </h2>
            <p className={styles.notesText}>
              Recordings attached to exam {detail.examMediaIndex.examId}
              {" "}via canonical media-archive
              `GET /media/exams/{`{examId}`}/media`. Playback/export
              remain unavailable until the dedicated features land.
            </p>
            {detail.examMediaIndex.indexError ? (
              <p
                className={styles.refError}
                aria-label="Exam media index error"
              >
                {detail.examMediaIndex.indexError}
              </p>
            ) : detail.examMediaIndex.recordings.length === 0 ? (
              <p className={styles.notesText}>
                No recordings attached to this exam yet.
              </p>
            ) : (
              <ul
                className={styles.refList}
                aria-label="Exam media recordings"
              >
                {detail.examMediaIndex.recordings.map((rec) => (
                  <li key={rec.recordingId} className={styles.refCard}>
                    <div className={styles.refTopRow}>
                      <span className={styles.refId}>{rec.recordingId}</span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <StatusDot
                          variant={mediaStatusDot(rec.status)}
                          halo={false}
                        />
                        <StatusBadge
                          variant={mediaStatusBadge(rec.status)}
                        >
                          {rec.statusLabel}
                        </StatusBadge>
                      </span>
                    </div>
                    <span className={styles.refMeta}>
                      Segments: {rec.segmentCount} · Started:{" "}
                      {rec.startedAt}
                      {rec.finalizedAt
                        ? ` · Finalized: ${rec.finalizedAt}`
                        : ""}
                    </span>
                    {rec.sessionId || rec.evidenceType ? (
                      <span className={styles.refMeta}>
                        {rec.sessionId
                          ? `Session: ${rec.sessionId}`
                          : ""}
                        {rec.sessionId && rec.evidenceType ? " · " : ""}
                        {rec.evidenceType
                          ? `Evidence type: ${rec.evidenceType}`
                          : ""}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <section
          className={`${styles.section} ${styles.sectionFull}`}
          aria-labelledby="evidence-detail-reports-title"
        >
          <h2
            id="evidence-detail-reports-title"
            className={styles.sectionTitle}
          >
            Report refs ({detail.reportRefs.length})
          </h2>
          {detail.reportRefs.length === 0 ? (
            <p className={styles.notesText}>
              No linked reporting documents.
            </p>
          ) : (
            <ul className={styles.refList} aria-label="Report refs">
              {detail.reportRefs.map((ref) => (
                <li key={ref.reportId} className={styles.refCard}>
                  <div className={styles.refTopRow}>
                    <span className={styles.refId}>{ref.reportId}</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <StatusDot
                        variant={reportStatusDot(ref.status)}
                        halo={false}
                      />
                      <StatusBadge variant={reportStatusBadge(ref.status)}>
                        {ref.statusLabel}
                      </StatusBadge>
                    </span>
                  </div>
                  <span className={styles.refMeta}>
                    Generated at: {ref.generatedAt}
                  </span>
                  {ref.reportError ? (
                    <p
                      className={styles.refError}
                      aria-label={`Report error for ${ref.reportId}`}
                    >
                      {ref.reportError}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
