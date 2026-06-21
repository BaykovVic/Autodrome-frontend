"use client";

import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  DegradedState,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  useConsoleEvidence,
  type ConsoleEvidenceLoader,
} from "./useConsoleEvidence";
import type {
  ConsoleEvidence,
  ConsoleEvidenceStatus,
  ConsoleEvidenceType,
} from "./consoleEvidenceSnapshot";
import styles from "./EvidenceScreen.module.css";

type Props = {
  loader?: ConsoleEvidenceLoader;
};

function typeBadge(type: ConsoleEvidenceType): StatusBadgeVariant {
  switch (type) {
    case "telemetry":
      return "info";
    case "video":
      return "info";
    case "photo":
      return "warning";
    case "audio":
      return "success";
    case "biometry":
    default:
      return "neutral";
  }
}

function typeDot(type: ConsoleEvidenceType): StatusDotVariant {
  switch (type) {
    case "telemetry":
      return "online";
    case "video":
      return "online";
    case "photo":
      return "degraded";
    case "audio":
      return "online";
    case "biometry":
    default:
      return "standby";
  }
}

function statusBadge(status: ConsoleEvidenceStatus): StatusBadgeVariant {
  switch (status) {
    case "sealed":
      return "success";
    case "pending":
      return "warning";
    case "failed":
    default:
      return "danger";
  }
}

function statusDot(status: ConsoleEvidenceStatus): StatusDotVariant {
  switch (status) {
    case "sealed":
      return "online";
    case "pending":
      return "degraded";
    case "failed":
    default:
      return "offline";
  }
}

function CameraIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
      className={styles.mediaPreviewIcon}
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <circle cx="12" cy="12.5" r="3" />
      <path d="M8 6l1.3-2h5.4L16 6" />
    </svg>
  );
}

export function EvidenceScreen({ loader }: Props) {
  const state = useConsoleEvidence(loader);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const evidence = useMemo(
    () => state.snapshot?.evidence ?? [],
    [state.snapshot],
  );

  const selected: ConsoleEvidence | undefined = useMemo(() => {
    if (selectedId) {
      const match = evidence.find((e) => e.id === selectedId);
      if (match) return match;
    }
    return evidence[0];
  }, [evidence, selectedId]);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Evidence">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading evidence" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Evidence">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const degraded = state.snapshot?.degraded ?? false;

  return (
    <section className={styles.screen} aria-label="Evidence">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Evidence</h1>
          <p className={styles.subtitle}>
            Sealed references · biometry, audio, telemetry, media
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled
          title="Bulk export flow lands with the evidence export integration feature."
        >
          Export selected
        </Button>
      </header>

      {degraded ? (
        <div className={styles.degradedWrap}>
          <DegradedState
            service="media-archive-service · evidence"
            onRetry={state.reload}
          />
        </div>
      ) : null}

      <div className={styles.body}>
        <div className={styles.tableColumn}>
          {evidence.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                title="No evidence"
                description="No evidence in this scenario."
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>Reference</th>
                  <th scope="col" className={styles.th}>Type</th>
                  <th scope="col" className={styles.th}>Captured</th>
                  <th
                    scope="col"
                    className={`${styles.th} ${styles.thRight}`}
                  >
                    Size
                  </th>
                  <th scope="col" className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((e) => {
                  const isSelected = e.id === selected?.id;
                  return (
                    <tr
                      key={e.id}
                      className={
                        isSelected
                          ? `${styles.row} ${styles.rowActive}`
                          : styles.row
                      }
                      aria-selected={isSelected}
                    >
                      <td className={styles.td}>
                        <button
                          type="button"
                          className={styles.refBtn}
                          onClick={() => setSelectedId(e.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          <span className={styles.refId}>{e.id}</span>
                          <span className={styles.refExam}>{e.examId}</span>
                        </button>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot variant={typeDot(e.type)} halo={false} />
                          <StatusBadge variant={typeBadge(e.type)}>
                            {e.typeLabel}
                          </StatusBadge>
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.mono}`}>
                        {e.captured}
                      </td>
                      <td
                        className={`${styles.td} ${styles.tdRight} ${styles.mono}`}
                      >
                        {e.size}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.statusCell}>
                          <StatusDot
                            variant={statusDot(e.status)}
                            halo={false}
                          />
                          <StatusBadge variant={statusBadge(e.status)}>
                            {e.statusLabel}
                          </StatusBadge>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected ? (
          <aside
            className={styles.detail}
            aria-label={`Evidence ${selected.id}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderRow}>
                <span className={styles.detailId}>{selected.id}</span>
                <span className={styles.statusCell}>
                  <StatusDot
                    variant={statusDot(selected.status)}
                    halo={false}
                  />
                  <StatusBadge variant={statusBadge(selected.status)}>
                    {selected.statusLabel}
                  </StatusBadge>
                </span>
              </div>
              <div className={styles.detailTypeRow}>
                <span className={styles.statusCell}>
                  <StatusDot
                    variant={typeDot(selected.type)}
                    halo={false}
                  />
                  <StatusBadge variant={typeBadge(selected.type)}>
                    {selected.typeLabel}
                  </StatusBadge>
                </span>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Media preview</div>
              <div className={styles.mediaPreview} role="img" aria-label={
                selected.previewAvailable
                  ? `${selected.typeLabel} preview placeholder`
                  : `${selected.typeLabel} preview unavailable offline`
              }>
                <CameraIcon />
                <span className={styles.mediaPreviewCaption}>
                  {selected.typeLabel} · preview unavailable offline
                </span>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Reference</div>
              <dl className={styles.refList}>
                <RefRow label="Source exam" value={selected.examId} mono />
                <RefRow label="Captured" value={selected.captured} mono />
                <RefRow label="Size on node" value={selected.size} mono />
                <RefRow label="SHA-256" value={selected.sha256} hash />
              </dl>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.actionRow}>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled
                  title="Hash verification lands with the evidence integrity integration feature."
                >
                  Verify hash
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled
                  title="Per-evidence export lands with the evidence export integration feature."
                >
                  Export
                </Button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function RefRow({
  label,
  value,
  mono,
  hash,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hash?: boolean;
}) {
  return (
    <div className={styles.refRow}>
      <dt className={styles.refLabel}>{label}</dt>
      <dd
        className={
          hash
            ? styles.refValueHash
            : mono
              ? styles.refValueMono
              : styles.refValue
        }
      >
        {value}
      </dd>
    </div>
  );
}
