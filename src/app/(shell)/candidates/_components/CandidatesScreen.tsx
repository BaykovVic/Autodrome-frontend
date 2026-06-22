"use client";

import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  EmptyState,
  PlusIcon,
  SearchIcon,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  useConsoleCandidates,
  type ConsoleCandidatesLoader,
} from "./useConsoleCandidates";
import type {
  CandidateEligibilityState,
  CandidateEnrollmentState,
  ConsoleCandidate,
} from "./consoleRegistrySnapshot";
import styles from "./CandidatesScreen.module.css";

type Props = {
  loader?: ConsoleCandidatesLoader;
};

type EnrollmentFilter =
  | "all"
  | "not-enrolled"
  | "in-progress"
  | "quality-issues"
  | "enrolled";

const FILTER_CHIPS: Array<{ id: EnrollmentFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "not-enrolled", label: "Not enrolled" },
  { id: "in-progress", label: "In progress" },
  { id: "quality-issues", label: "Quality issues" },
  { id: "enrolled", label: "Enrolled" },
];

const IN_PROGRESS_STATES = new Set<CandidateEnrollmentState>([
  "capturing",
  "command-sent",
  "ready-to-enroll",
  "needs-retry",
]);

const QUALITY_ISSUE_STATES = new Set<CandidateEnrollmentState>([
  "quality-failed",
  "device-unavailable",
  "session-expired",
]);

function matchesFilter(
  state: CandidateEnrollmentState,
  filter: EnrollmentFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "not-enrolled":
      return state === "not-enrolled";
    case "in-progress":
      return IN_PROGRESS_STATES.has(state);
    case "quality-issues":
      return QUALITY_ISSUE_STATES.has(state);
    case "enrolled":
      return state === "enrolled";
  }
}

function enrollmentDot(
  state: CandidateEnrollmentState,
): StatusDotVariant {
  switch (state) {
    case "enrolled":
      return "online";
    case "capturing":
    case "command-sent":
      return "degraded";
    case "ready-to-enroll":
      return "standby";
    case "needs-retry":
      return "degraded";
    case "quality-failed":
    case "device-unavailable":
    case "session-expired":
      return "offline";
    case "not-enrolled":
    default:
      return "unknown";
  }
}

function enrollmentBadge(
  state: CandidateEnrollmentState,
): StatusBadgeVariant {
  switch (state) {
    case "enrolled":
      return "success";
    case "capturing":
    case "command-sent":
    case "ready-to-enroll":
    case "needs-retry":
      return "info";
    case "quality-failed":
    case "device-unavailable":
    case "session-expired":
      return "danger";
    case "not-enrolled":
    default:
      return "neutral";
  }
}

function eligibilityBadge(
  state: CandidateEligibilityState,
): StatusBadgeVariant {
  switch (state) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "denied":
      return "danger";
    case "expired":
    default:
      return "neutral";
  }
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function FaceIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" />
      <circle cx="12" cy="11" r="2.4" />
      <path d="M9.2 16a3.2 3.2 0 0 1 5.6 0" />
    </svg>
  );
}

export function CandidatesScreen({ loader }: Props) {
  const state = useConsoleCandidates(loader);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EnrollmentFilter>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    undefined,
  );

  const candidates = useMemo(
    () => state.snapshot?.candidates ?? [],
    [state.snapshot],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (!matchesFilter(c.enrollment.state, filter)) return false;
      if (needle.length === 0) return true;
      return [c.id, c.name, c.document]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [candidates, search, filter]);

  const selected: ConsoleCandidate | undefined = useMemo(() => {
    if (selectedId) {
      const match = candidates.find((c) => c.id === selectedId);
      if (match) return match;
    }
    return visible[0] ?? candidates[0];
  }, [candidates, visible, selectedId]);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="Candidates registry"
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading candidates" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="Candidates registry"
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

  return (
    <section
      className={styles.screen}
      aria-label="Candidates registry"
    >
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Candidates</h1>
            <p className={styles.subtitle}>
              {state.snapshot
                ? `${state.snapshot.totals.total} records · ${state.snapshot.totals.awaitingEnrollment} awaiting enrollment`
                : "Loading registry…"}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled
            title="Registration flow lands in a follow-up feature."
          >
            <PlusIcon />
            Register candidate
          </Button>
        </div>
        <div
          className={styles.filters}
          role="search"
          aria-label="Candidates filters"
        >
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              className={styles.search}
              placeholder="Search name, ID or document…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
            />
          </div>
          <div
            className={styles.chips}
            role="tablist"
            aria-label="Enrollment filter"
          >
            {FILTER_CHIPS.map((chip) => {
              const isActive = chip.id === filter;
              return (
                <button
                  key={chip.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={
                    isActive
                      ? `${styles.chip} ${styles.chipActive}`
                      : styles.chip
                  }
                  onClick={() => setFilter(chip.id)}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.tableColumn}>
          {visible.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                title="No candidates"
                description={
                  candidates.length === 0
                    ? "No candidates in this scenario."
                    : "No candidates match current filters."
                }
              />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>Candidate</th>
                  <th scope="col" className={styles.th}>Masked DOB</th>
                  <th scope="col" className={styles.th}>Eligibility</th>
                  <th scope="col" className={styles.th}>Face template</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const isSelected = c.id === selected?.id;
                  return (
                    <tr
                      key={c.id}
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
                          className={styles.candidateNameBtn}
                          onClick={() => setSelectedId(c.id)}
                          aria-current={isSelected ? "true" : undefined}
                        >
                          <span className={styles.candidateName}>
                            {c.name}
                          </span>
                          <span className={styles.mono}>{c.id}</span>
                        </button>
                      </td>
                      <td className={`${styles.td} ${styles.mono}`}>
                        {c.maskedDob}
                      </td>
                      <td className={styles.td}>
                        <StatusBadge
                          variant={eligibilityBadge(c.eligibility.state)}
                        >
                          {c.eligibility.label}
                        </StatusBadge>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.faceCell}>
                          <StatusDot
                            variant={enrollmentDot(c.enrollment.state)}
                            halo={false}
                          />
                          <StatusBadge
                            variant={enrollmentBadge(c.enrollment.state)}
                          >
                            {c.enrollment.label}
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
            aria-label={`Candidate ${selected.id}`}
          >
            <div className={styles.detailHeader}>
              <div className={styles.avatar} aria-hidden="true">
                {initialsOf(selected.name)}
              </div>
              <div className={styles.detailIdentity}>
                <div className={styles.detailName}>{selected.name}</div>
                <div className={styles.mono}>{selected.id}</div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Identity</div>
              <dl className={styles.detailsList}>
                <DetailRow
                  label="Masked DOB"
                  value={selected.maskedDob}
                  mono
                />
                <DetailRow
                  label="Document"
                  value={selected.document}
                  mono
                />
                <DetailRow
                  label="Eligibility"
                  value={selected.eligibility.label}
                />
                <DetailRow
                  label="Last enrollment"
                  value={selected.enrollment.lastEnrollment}
                  mono
                />
              </dl>
            </div>

            <div className={styles.enrollmentPanel}>
              <div className={styles.enrollmentHead}>
                <span className={styles.enrollmentHeadLeft}>
                  <FaceIcon />
                  <span className={styles.enrollmentHeadTitle}>
                    Face enrollment
                  </span>
                </span>
                <span className={styles.faceCell}>
                  <StatusDot
                    variant={enrollmentDot(selected.enrollment.state)}
                    halo={false}
                  />
                  <StatusBadge
                    variant={enrollmentBadge(selected.enrollment.state)}
                  >
                    {selected.enrollment.label}
                  </StatusBadge>
                </span>
              </div>
              <dl className={styles.enrollmentList}>
                <DetailRow
                  label="Template status"
                  value={selected.enrollment.templateStatus}
                />
                <DetailRow
                  label="Source device"
                  value={selected.enrollment.sourceDevice}
                  mono
                />
              </dl>
              <p className={styles.enrollmentNote}>
                Enrollment-only surface. Per-exam face verification and
                passive liveness checks are tracked outside this view.
              </p>
              <div className={styles.detailActionRow}>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  disabled
                  title="Start-enrollment dialog lands in a follow-up feature."
                >
                  Start enrollment
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled
                  title="Session monitor lands in a follow-up feature."
                >
                  Sessions
                </Button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd
        className={
          mono
            ? `${styles.detailValue} ${styles.mono}`
            : styles.detailValue
        }
      >
        {value}
      </dd>
    </div>
  );
}
