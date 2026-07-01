"use client";

import type { ReactNode } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";
import { ApiErrorView, EmptyState, Skeleton, StatusBadge } from "@/components";

import { canAccess, CONSOLE_PERMISSIONS } from "../../_session/consolePermissions";
import { useOptionalSession } from "../../_session/SessionProvider";
import {
  useConsoleSecurity,
  type ConsoleSecurityLoader,
} from "./useConsoleSecurity";
import {
  SECURITY_ACTOR_TYPE_LABELS,
  SECURITY_ROLE_LABELS,
  type ConsoleSecuritySnapshot,
} from "./consoleSecuritySnapshot";
import { SecurityOperatorsTable } from "./SecurityOperatorsTable";
import {
  liveRoleManagementActions,
  type RoleManagementActions,
} from "./useRoleManagement";
import styles from "./SecurityScreen.module.css";

type Props = {
  loader?: ConsoleSecurityLoader;
  /**
   * Injected role-management actions (tests / storybook). When
   * omitted, live mode binds the canonical identity-security
   * endpoints and mock mode stays read-only.
   */
  roleManagement?: RoleManagementActions | null;
};

export function SecurityScreen({ loader, roleManagement }: Props) {
  const state = useConsoleSecurity(loader);
  const session = useOptionalSession();

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

  // Role management binds the canonical live endpoints only in live
  // mode (or when injected); mock mode keeps the read-only matrix.
  const actions: RoleManagementActions | null =
    roleManagement ??
    (resolveRuntimeMode() === "live"
      ? liveRoleManagementActions(getApiAdapter({ mode: "live" }))
      : null);
  const canManage = canAccess(session, CONSOLE_PERMISSIONS.identityManage);

  return renderSecurity(
    snap,
    <SecurityOperatorsTable
      operators={snap.operators}
      roleManagement={actions}
      canManage={canManage}
    />,
  );
}

function renderSecurity(
  snap: ConsoleSecuritySnapshot,
  operatorsSection: ReactNode,
) {
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

        {operatorsSection}
      </div>
    </section>
  );
}
