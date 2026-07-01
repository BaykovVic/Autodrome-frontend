"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components";

import { CONSOLE_PERMISSIONS } from "../../_session/consolePermissions";
import { PermissionGate } from "../../_session/PermissionGate";
import {
  ALL_SECURITY_ROLES,
  SECURITY_ACTOR_TYPE_LABELS,
  SECURITY_ROLE_LABELS,
  type ConsoleSecurityActor,
  type ConsoleSecurityRole,
} from "./consoleSecuritySnapshot";
import type { UserRoles } from "./liveRoleManagement";
import {
  useRoleManagement,
  type RoleManagementActions,
} from "./useRoleManagement";
import styles from "./SecurityScreen.module.css";

const DISABLED_TITLE =
  "Identity service exposes /auth/me only — assign/revoke ships with a future user-role-permission endpoint.";

const NOOP_ACTIONS: RoleManagementActions = {
  assign: () => Promise.reject(new Error("role management unavailable")),
  revoke: () => Promise.reject(new Error("role management unavailable")),
};

function has(
  roles: ConsoleSecurityRole[],
  role: ConsoleSecurityRole,
): boolean {
  return roles.includes(role);
}

/**
 * Operator role matrix.
 *
 * - Read-only (mock, or no `roleManagement`): static role dots +
 *   disabled Assign/Revoke buttons (permission-gated) — unchanged
 *   behaviour.
 * - Live + `user.assign`: each role cell is a toggle button wired to
 *   the canonical assign/revoke endpoints. The backend response is
 *   the source of truth (applied as an override); one action at a
 *   time; failures surface a classified error (403 → access denied).
 */
export function SecurityOperatorsTable({
  operators,
  roleManagement,
  canManage,
}: {
  operators: ConsoleSecurityActor[];
  roleManagement: RoleManagementActions | null;
  canManage: boolean;
}) {
  const interactive = Boolean(roleManagement) && canManage;

  const [overrides, setOverrides] = useState<
    Record<string, ConsoleSecurityRole[]>
  >({});
  const onApplied = useCallback((result: UserRoles) => {
    setOverrides((prev) => ({ ...prev, [result.userId]: result.roles }));
  }, []);
  const rm = useRoleManagement(roleManagement ?? NOOP_ACTIONS, onApplied);

  const rolesFor = (op: ConsoleSecurityActor): ConsoleSecurityRole[] =>
    overrides[op.actorId] ?? op.roles;

  return (
    <section
      className={styles.section}
      aria-labelledby="security-operators-title"
    >
      <h2 id="security-operators-title" className={styles.sectionTitle}>
        Operators &amp; roles ({operators.length})
      </h2>

      {rm.error ? (
        <p
          className={styles.degradedBanner}
          role="alert"
          aria-label="Role management error"
        >
          {rm.error.classification.title}: {rm.error.classification.description}{" "}
          <Button size="sm" variant="ghost" onClick={rm.clearError}>
            Dismiss
          </Button>
        </p>
      ) : null}

      {operators.length === 0 ? (
        <p className={styles.notesText}>
          No operators returned from identity service.
        </p>
      ) : (
        <table className={styles.table} aria-label="Operator role matrix">
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
            {operators.map((op) => {
              const roles = rolesFor(op);
              const busy =
                rm.pending !== null && rm.pending.userId === op.actorId;
              return (
                <tr key={op.actorId}>
                  <td>
                    <div>{op.label}</div>
                    <div className={styles.canonicalChip}>{op.actorId}</div>
                  </td>
                  <td>
                    {SECURITY_ACTOR_TYPE_LABELS[op.actorType]}{" "}
                    <span className={styles.canonicalChip}>
                      ({op.actorType})
                    </span>
                  </td>
                  {ALL_SECURITY_ROLES.map((r) => {
                    const held = has(roles, r);
                    if (!interactive) {
                      return (
                        <td
                          key={r}
                          aria-label={`${op.label} ${
                            held ? "has" : "does not have"
                          } role ${r}`}
                        >
                          <span
                            className={held ? styles.dot : styles.dotEmpty}
                          >
                            {held ? "●" : "○"}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={r}>
                        <button
                          type="button"
                          className={styles.cellToggle}
                          disabled={rm.pending !== null}
                          aria-label={`${held ? "Revoke" : "Assign"} role ${r} ${
                            held ? "from" : "to"
                          } ${op.label}`}
                          aria-pressed={held}
                          onClick={() =>
                            held
                              ? rm.revoke(op.actorId, r)
                              : rm.assign(op.actorId, r)
                          }
                        >
                          <span
                            className={held ? styles.dot : styles.dotEmpty}
                          >
                            {held ? "●" : "○"}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                  <td>
                    {interactive ? (
                      <span className={styles.notesText}>
                        {busy
                          ? `Updating ${rm.pending?.role}…`
                          : "Toggle a role cell"}
                      </span>
                    ) : (
                      <div
                        className={styles.actionsRow}
                        role="group"
                        aria-label={`Role actions for ${op.label}`}
                      >
                        <PermissionGate
                          permission={CONSOLE_PERMISSIONS.identityManage}
                          fallback={
                            <span className={styles.notesText}>
                              Requires {CONSOLE_PERMISSIONS.identityManage}
                            </span>
                          }
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            disabled
                            title={DISABLED_TITLE}
                          >
                            Assign
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            disabled
                            title={DISABLED_TITLE}
                          >
                            Revoke
                          </Button>
                        </PermissionGate>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
