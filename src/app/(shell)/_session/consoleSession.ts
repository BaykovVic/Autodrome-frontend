/**
 * Console session view-model.
 *
 * The session shell knows the current authenticated actor — its
 * canonical roles and effective permission keys — sourced from the
 * identity-security `/auth/me` endpoint.
 *
 * Authorization policy lives in the backend. The frontend only
 * reflects the actor's backend-provided roles/permissions and never
 * hardcodes which role may perform which action. `sessionHasRole` /
 * `sessionHasPermission` are pure membership checks over the lists
 * returned by the backend — they are not policy decisions.
 *
 * Role tokens are 1:1 with the canonical `identity-security-service`
 * `Role` enum; the labels below are presentation only.
 */

export type ConsoleSessionActorType =
  | "user"
  | "service"
  | "device"
  | "system";

export type ConsoleSessionRole =
  | "admin"
  | "operator"
  | "inspector"
  | "dispatcher"
  | "auditor"
  | "techAdmin";

export type ConsoleSessionActor = {
  /** Canonical subject id (uuid) from the identity service. */
  actorId: string;
  actorType: ConsoleSessionActorType;
  /** Display label resolved from backend (login / full name). */
  label: string;
  /** Canonical roles assigned to the actor. */
  roles: ConsoleSessionRole[];
  /** Effective permission keys granted by the assigned roles. */
  permissions: string[];
};

/**
 * Result returned by a session loader — either a mock fixture or the
 * live `/auth/me` call. `unauthenticated` is a normal, expected
 * outcome (no/expired token), distinct from a transport error.
 */
export type ConsoleSessionResult =
  | { status: "authenticated"; actor: ConsoleSessionActor }
  | { status: "unauthenticated"; reason?: string };

/**
 * Full session state for the shell, including the transient loading
 * phase and a transport `error` phase (identity service unreachable).
 */
export type ConsoleSessionState =
  | { phase: "loading" }
  | { phase: "authenticated"; actor: ConsoleSessionActor }
  | { phase: "unauthenticated"; reason?: string }
  | { phase: "error"; error: unknown };

export const SESSION_ROLE_LABELS: Record<ConsoleSessionRole, string> = {
  admin: "Administrator",
  operator: "Operator",
  inspector: "Inspector",
  dispatcher: "Dispatcher",
  auditor: "Auditor",
  techAdmin: "Tech administrator",
};

export const ALL_SESSION_ROLES: ConsoleSessionRole[] = [
  "admin",
  "operator",
  "inspector",
  "dispatcher",
  "auditor",
  "techAdmin",
];

/** Pure membership check — does the backend grant this role to the actor? */
export function sessionHasRole(
  actor: ConsoleSessionActor,
  role: ConsoleSessionRole,
): boolean {
  return actor.roles.includes(role);
}

/** Pure membership check — does the actor hold this effective permission? */
export function sessionHasPermission(
  actor: ConsoleSessionActor,
  permission: string,
): boolean {
  return actor.permissions.includes(permission);
}

/** Initials for a display label, e.g. "Anna Petrova" → "AP". */
export function actorInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Primary role label for compact display (first canonical role). */
export function primaryRoleLabel(actor: ConsoleSessionActor): string {
  const first = actor.roles[0];
  return first ? SESSION_ROLE_LABELS[first] : "No role";
}
