"use client";

import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
  StatusBadge,
} from "@/components";
import {
  useConsoleSecurity,
  type ConsoleSecurityLoader,
} from "./useConsoleSecurity";
import {
  ALL_SECURITY_ROLES,
  SECURITY_ACTOR_TYPE_LABELS,
  SECURITY_ROLE_LABELS,
  type ConsoleSecurityActor,
  type ConsoleSecurityRole,
  type ConsoleSecuritySnapshot,
} from "./consoleSecuritySnapshot";
import styles from "./SecurityScreen.module.css";

type Props = {
  loader?: ConsoleSecurityLoader;
};

export function SecurityScreen({ loader }: Props) {
  const state = useConsoleSecurity(loader);

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Security workspace">
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading security workspace" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Security workspace">
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const snap = state.snapshot;
  if (!snap) {
    return (
      <section className={styles.screen} aria-label="Security workspace">
        <div className={styles.loadingPad}>
          <EmptyState
            title="No security snapshot"
            description="Live and mock loaders both returned no data."
          />
        </div>
      </section>
    );
  }

  return renderSecurity(snap);
}

function hasRole(
  actor: ConsoleSecurityActor,
  role: ConsoleSecurityRole,
): boolean {
  return actor.roles.includes(role);
}

function renderSecurity(snap: ConsoleSecuritySnapshot) {
  const disabledTitle =
    "Identity service exposes /auth/me only — assign/revoke ships with a future user-role-permission endpoint.";
  return (
    <section className={styles.screen} aria-label="Security workspace">
      <header className={styles.header}>
        <h1 className={styles.title}>Security &amp; identity</h1>
        <p className={styles.subtitle}>
          {snap.currentActor ? (
            <>
              Current actor:{" "}
              <strong>{snap.currentActor.label}</strong>{" "}
              <span className={styles.canonicalChip}>
                ({snap.currentActor.actorType})
              </span>{" "}
              · roles{" "}
              <strong>{snap.currentActor.roles.length}</strong> ·
              effective permissions{" "}
              <strong>{snap.currentActor.permissions.length}</strong>
            </>
          ) : (
            "No authenticated actor."
          )}
        </p>
      </header>

      {snap.degradedNote ? (
        <p
          className={styles.degradedBanner}
          role="status"
          aria-label="Security degraded note"
        >
          {snap.degradedNote}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="security-current-actor-title"
        >
          <h2
            id="security-current-actor-title"
            className={styles.sectionTitle}
          >
            Current actor
          </h2>
          {snap.currentActor ? (
            <dl>
              <div>
                <dt className={styles.notesText}>Actor id</dt>
                <dd className={styles.cellMono}>
                  {snap.currentActor.actorId}
                </dd>
              </div>
              <div>
                <dt className={styles.notesText}>Actor type</dt>
                <dd>
                  {SECURITY_ACTOR_TYPE_LABELS[snap.currentActor.actorType]}{" "}
                  <span className={styles.canonicalChip}>
                    ({snap.currentActor.actorType})
                  </span>
                </dd>
              </div>
              <div>
                <dt className={styles.notesText}>Roles</dt>
                <dd>
                  {snap.currentActor.roles.length === 0
                    ? "—"
                    : snap.currentActor.roles.map((r) => (
                        <StatusBadge key={r} variant="info">
                          {SECURITY_ROLE_LABELS[r]} ({r})
                        </StatusBadge>
                      ))}
                </dd>
              </div>
              <div>
                <dt className={styles.notesText}>
                  Effective permissions
                </dt>
                <dd className={styles.cellMono}>
                  {snap.currentActor.permissions.length === 0
                    ? "—"
                    : snap.currentActor.permissions.join(", ")}
                </dd>
              </div>
            </dl>
          ) : (
            <p className={styles.notesText}>
              No authenticated actor — `/auth/me` returned empty.
            </p>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="security-operators-title"
        >
          <h2
            id="security-operators-title"
            className={styles.sectionTitle}
          >
            Operators &amp; roles ({snap.operators.length})
          </h2>
          {snap.operators.length === 0 ? (
            <p className={styles.notesText}>
              No operators returned from identity service.
            </p>
          ) : (
            <table
              className={styles.table}
              aria-label="Operator role matrix"
            >
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Type</th>
                  {ALL_SECURITY_ROLES.map((r) => (
                    <th key={r}>
                      {SECURITY_ROLE_LABELS[r]}{" "}
                      <span className={styles.canonicalChip}>({r})</span>
                    </th>
                  ))}
                  <th className={styles.notesText}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {snap.operators.map((op) => (
                  <tr key={op.actorId}>
                    <td>
                      <div>{op.label}</div>
                      <div className={styles.canonicalChip}>
                        {op.actorId}
                      </div>
                    </td>
                    <td>
                      {SECURITY_ACTOR_TYPE_LABELS[op.actorType]}{" "}
                      <span className={styles.canonicalChip}>
                        ({op.actorType})
                      </span>
                    </td>
                    {ALL_SECURITY_ROLES.map((r) => (
                      <td
                        key={r}
                        aria-label={`${op.label} ${
                          hasRole(op, r) ? "has" : "does not have"
                        } role ${r}`}
                      >
                        <span
                          className={
                            hasRole(op, r) ? styles.dot : styles.dotEmpty
                          }
                        >
                          {hasRole(op, r) ? "●" : "○"}
                        </span>
                      </td>
                    ))}
                    <td>
                      <div
                        className={styles.actionsRow}
                        role="group"
                        aria-label={`Role actions for ${op.label}`}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          disabled
                          title={disabledTitle}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          disabled
                          title={disabledTitle}
                        >
                          Revoke
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </section>
  );
}
