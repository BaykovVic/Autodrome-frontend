"use client";

import { useMemo, useState } from "react";

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
  useConsoleCandidates,
  type ConsoleCandidatesLoader,
} from "./useConsoleCandidates";
import type {
  CandidateFaceState,
  CandidateRegistrationState,
  ConsoleCandidate,
} from "./consoleRegistrySnapshot";
import styles from "./CandidatesScreen.module.css";

type Props = {
  loader?: ConsoleCandidatesLoader;
};

function regBadgeVariant(
  state: CandidateRegistrationState,
): StatusBadgeVariant {
  switch (state) {
    case "registered":
      return "success";
    case "pending":
      return "warning";
    case "incomplete":
    default:
      return "danger";
  }
}

function faceDotVariant(state: CandidateFaceState): StatusDotVariant {
  switch (state) {
    case "verified":
      return "online";
    case "pending":
      return "degraded";
    case "unverified":
    default:
      return "offline";
  }
}

function faceBadgeVariant(state: CandidateFaceState): StatusBadgeVariant {
  switch (state) {
    case "verified":
      return "success";
    case "pending":
      return "warning";
    case "unverified":
    default:
      return "danger";
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

export function CandidatesScreen({ loader }: Props) {
  const state = useConsoleCandidates(loader);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("any");
  const [registration, setRegistration] =
    useState<CandidateRegistrationState | "any">("any");
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
      if (category !== "any" && c.category !== category) return false;
      if (registration !== "any" && c.registration.state !== registration) {
        return false;
      }
      if (needle.length === 0) return true;
      return [c.id, c.name, c.category]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [candidates, search, category, registration]);

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
                ? `${state.snapshot.totals.total} records · ${state.snapshot.totals.awaitingFaceVerification} awaiting face verification`
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
            Register candidate
          </Button>
        </div>
        <div className={styles.filters} role="search" aria-label="Candidates filters">
          <input
            className={styles.search}
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
          <select
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
          >
            <option value="any">All categories</option>
            <option value="Cat A">Cat A</option>
            <option value="Cat B">Cat B</option>
            <option value="Cat C">Cat C</option>
          </select>
          <select
            className={styles.select}
            value={registration}
            onChange={(e) =>
              setRegistration(
                e.target.value as CandidateRegistrationState | "any",
              )
            }
            aria-label="Registration"
          >
            <option value="any">All statuses</option>
            <option value="registered">Registered</option>
            <option value="pending">Pending</option>
            <option value="incomplete">Incomplete</option>
          </select>
          <span className={styles.sortNote}>Sorted by last activity</span>
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
                  <th scope="col" className={styles.th}>Cat</th>
                  <th scope="col" className={styles.th}>Registration</th>
                  <th scope="col" className={styles.th}>Face verify</th>
                  <th
                    scope="col"
                    className={`${styles.th} ${styles.thRight}`}
                  >
                    Exams
                  </th>
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
                        {c.category}
                      </td>
                      <td className={styles.td}>
                        <StatusBadge
                          variant={regBadgeVariant(c.registration.state)}
                        >
                          {c.registration.label}
                        </StatusBadge>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.faceCell}>
                          <StatusDot
                            variant={faceDotVariant(c.face.state)}
                            halo={false}
                          />
                          <StatusBadge
                            variant={faceBadgeVariant(c.face.state)}
                          >
                            {c.face.label}
                          </StatusBadge>
                        </span>
                      </td>
                      <td
                        className={`${styles.td} ${styles.tdRight} ${styles.mono}`}
                      >
                        {c.examCount}
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
              <div
                className={styles.avatar}
                aria-hidden="true"
              >
                {initialsOf(selected.name)}
              </div>
              <div className={styles.detailIdentity}>
                <div className={styles.detailName}>{selected.name}</div>
                <div className={styles.mono}>{selected.id}</div>
                <StatusBadge
                  variant={regBadgeVariant(selected.registration.state)}
                >
                  {selected.registration.label}
                </StatusBadge>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Face verification</div>
              <div className={styles.faceBlock}>
                <div
                  className={styles.faceFrame}
                  aria-hidden="true"
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="9" r="3.5" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                </div>
                <div className={styles.faceMeta}>
                  <span className={styles.faceBadgeRow}>
                    <StatusDot
                      variant={faceDotVariant(selected.face.state)}
                      halo={false}
                    />
                    <StatusBadge
                      variant={faceBadgeVariant(selected.face.state)}
                    >
                      {selected.face.label}
                    </StatusBadge>
                  </span>
                  {selected.face.confidence ? (
                    <div className={styles.faceConfidence}>
                      Confidence{" "}
                      <span className={styles.mono}>
                        {selected.face.confidence}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.sectionTitle}>Details</div>
              <dl className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Category</dt>
                  <dd className={styles.detailValue}>{selected.category}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Date of birth</dt>
                  <dd className={`${styles.detailValue} ${styles.mono}`}>
                    {selected.dateOfBirth}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Phone</dt>
                  <dd className={`${styles.detailValue} ${styles.mono}`}>
                    {selected.phone}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Last activity</dt>
                  <dd className={`${styles.detailValue} ${styles.mono}`}>
                    {selected.lastActivity}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailActions}>
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled
                title="Start-exam handoff lands in the exam-design feature."
              >
                Start exam
              </Button>
              <div className={styles.detailActionRow}>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled
                  title="Face capture lands with the biometry integration feature."
                >
                  Capture face
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled
                  title="Editing lands with the registration form feature."
                >
                  Edit
                </Button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
