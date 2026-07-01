import { sessionHasPermission } from "./consoleSession";
import type { UseConsoleSession } from "./useConsoleSession";

/**
 * Canonical RBAC permission keys the console gates UI actions on.
 *
 * These mirror the backend contract
 * `contracts/docs/authorization/rbac-permission-matrix.md`
 * (feature `rbac-permission-matrix-contract-baseline`). The frontend
 * is NOT the security boundary — these keys only decide which
 * navigation entries and command buttons the UI *offers*; every call
 * is still authorized by the backend. Admin-only mutations use the
 * `*.manage`-style keys from the matrix.
 */
export const CONSOLE_PERMISSIONS = {
  /** Read the identity / security workspace (operator & role directory). */
  identityRead: "user.read",
  /** Assign / revoke operator roles (admin-only mutation). */
  identityManage: "user.assign",
  /** Read the audit workspace / verification exports. */
  auditRead: "audit.read",
} as const;

export type ConsolePermissionKey =
  (typeof CONSOLE_PERMISSIONS)[keyof typeof CONSOLE_PERMISSIONS];

/**
 * Decide whether the current session may be offered an action guarded
 * by `requiredPermission`.
 *
 * Fail-open rules (UI convenience, not a security decision):
 *  - no required permission → allowed (ungated action);
 *  - no session context (isolated render / unit tests) → allowed, so
 *    a component rendered without a `SessionProvider` behaves as it
 *    did before RBAC gating;
 *  - authenticated → allowed iff the actor holds the permission;
 *  - loading / unauthenticated / error → not allowed.
 */
export function canAccess(
  session: UseConsoleSession | null,
  requiredPermission?: string,
): boolean {
  if (!requiredPermission) return true;
  if (!session) return true;
  if (session.phase !== "authenticated") return false;
  return sessionHasPermission(session.actor, requiredPermission);
}
