/**
 * Console-shaped security workspace snapshot.
 *
 * Surfaces canonical `identity-security-service` Actor +
 * Role + Permission concepts:
 *
 *   - `ConsoleSecurityRole` (6 канонических enums): `admin`,
 *     `operator`, `inspector`, `dispatcher`, `auditor`,
 *     `techAdmin`. Соответствует backend `Role`.
 *   - `ConsoleSecurityActor`: actorId + actorType +
 *     roles[] + permissions[]. Соответствует `Actor` DTO.
 *   - `ConsoleSecurityPermission`: short string keys
 *     (e.g. "exam.create", "candidate.enroll").
 *     Permission catalog хранится в backend; frontend
 *     получает effective `permissions` from `/auth/me`.
 *
 * Per spec rule "Frontend не хардкодит authorization
 * policy": role → permission matrix мы рендерим как
 * read-only reference от backend ответа. Assign/revoke
 * actions disabled до появления canonical assign endpoint
 * (identity-security-service-user-role-permission-baseline
 * сейчас exposes только auth + token revoke, не role
 * assignment).
 */

export type ConsoleSecurityRole =
  | "admin"
  | "operator"
  | "inspector"
  | "dispatcher"
  | "auditor"
  | "techAdmin";

export type ConsoleSecurityActorType =
  | "user"
  | "service"
  | "device"
  | "system";

export type ConsoleSecurityActor = {
  actorId: string;
  actorType: ConsoleSecurityActorType;
  /** Display label resolved from backend (e.g. login or full name). */
  label: string;
  roles: ConsoleSecurityRole[];
  /** Effective permission keys granted by the assigned roles. */
  permissions: string[];
};

export type ConsoleSecuritySnapshot = {
  /** Current authenticated actor returned by GET /auth/me. */
  currentActor: ConsoleSecurityActor | null;
  /** All operator users known to the workspace. */
  operators: ConsoleSecurityActor[];
  /**
   * Role catalog: union of roles seen across operators
   * (always включает 6 canonical roles даже если
   * operators[] пустой).
   */
  roles: ConsoleSecurityRole[];
  /** Honest degraded note when backend exposes only auth/me. */
  degradedNote?: string;
};

export const SECURITY_ROLE_LABELS: Record<
  ConsoleSecurityRole,
  string
> = {
  admin: "Administrator",
  operator: "Operator",
  inspector: "Inspector",
  dispatcher: "Dispatcher",
  auditor: "Auditor",
  techAdmin: "Tech administrator",
};

export const SECURITY_ACTOR_TYPE_LABELS: Record<
  ConsoleSecurityActorType,
  string
> = {
  user: "User",
  service: "Service",
  device: "Device",
  system: "System",
};

export const ALL_SECURITY_ROLES: ConsoleSecurityRole[] = [
  "admin",
  "operator",
  "inspector",
  "dispatcher",
  "auditor",
  "techAdmin",
];
