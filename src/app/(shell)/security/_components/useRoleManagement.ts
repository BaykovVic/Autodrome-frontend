"use client";

import { useCallback, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  classifyError,
  type ApiErrorClassification,
} from "@/api/error-taxonomy";

import type { ConsoleSecurityRole } from "./consoleSecuritySnapshot";
import {
  liveAssignRole,
  liveRevokeRole,
  type UserRoles,
} from "./liveRoleManagement";

export type RoleActionKind = "assign" | "revoke";

export type RoleManagementActions = {
  assign: (userId: string, role: ConsoleSecurityRole) => Promise<UserRoles>;
  revoke: (userId: string, role: ConsoleSecurityRole) => Promise<UserRoles>;
};

/** Bind the canonical live endpoints to a role-management action set. */
export function liveRoleManagementActions(
  adapter: AutodromeApi,
): RoleManagementActions {
  return {
    assign: (userId, role) => liveAssignRole(adapter, userId, role),
    revoke: (userId, role) => liveRevokeRole(adapter, userId, role),
  };
}

export type RolePending = {
  userId: string;
  role: ConsoleSecurityRole;
  kind: RoleActionKind;
};

export type RoleActionError = RolePending & {
  classification: ApiErrorClassification;
};

export type UseRoleManagement = {
  /** The single in-flight action, or null. */
  pending: RolePending | null;
  /** The last failed action (classified), or null. */
  error: RoleActionError | null;
  assign: (userId: string, role: ConsoleSecurityRole) => void;
  revoke: (userId: string, role: ConsoleSecurityRole) => void;
  clearError: () => void;
};

/**
 * Drives assign/revoke against an injected action set, exposing a
 * single-in-flight `pending` and a classified `error`. On success it
 * calls `onApplied` with the canonical resulting role set so the
 * caller reconciles its view (no optimistic guessing — the backend
 * response is the source of truth).
 */
export function useRoleManagement(
  actions: RoleManagementActions,
  onApplied: (result: UserRoles) => void,
): UseRoleManagement {
  const [pending, setPending] = useState<RolePending | null>(null);
  const [error, setError] = useState<RoleActionError | null>(null);

  const run = useCallback(
    (kind: RoleActionKind, userId: string, role: ConsoleSecurityRole) => {
      // Guard: one action at a time.
      setPending((current) => current ?? { userId, role, kind });
      setError(null);
      const call = kind === "assign" ? actions.assign : actions.revoke;
      call(userId, role)
        .then((result) => {
          onApplied(result);
          setPending(null);
        })
        .catch((err) => {
          setError({
            userId,
            role,
            kind,
            classification: classifyError(err),
          });
          setPending(null);
        });
    },
    [actions, onApplied],
  );

  const assign = useCallback(
    (userId: string, role: ConsoleSecurityRole) =>
      run("assign", userId, role),
    [run],
  );
  const revoke = useCallback(
    (userId: string, role: ConsoleSecurityRole) =>
      run("revoke", userId, role),
    [run],
  );
  const clearError = useCallback(() => setError(null), []);

  return { pending, error, assign, revoke, clearError };
}
