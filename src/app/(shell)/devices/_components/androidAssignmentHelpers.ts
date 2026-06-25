/**
 * Pure helpers for the Android device assign + retire command UI.
 *
 * No live API calls — these helpers shape and validate operator
 * input + build canonical bodies. The dialog components call the
 * helpers; the hook decides whether to dispatch to the live
 * `liveAndroidDeviceAssign` / `liveAndroidDeviceRetire` commands
 * (live mode) or mutate the local snapshot (mock mode).
 *
 * Canonical naming compliance (per cross-scope feature map):
 *
 *   - Role enum: `registrar` / `vehicleVerifier`.
 *   - Binding type enum: `receptionPoint` / `workstation` /
 *     `vehicle`.
 *   - Role↔binding invariant:
 *     - `registrar` accepts `receptionPoint` OR `workstation`;
 *     - `vehicleVerifier` accepts only `vehicle`.
 *   - Operator-side write shapes: `AndroidDeviceAssignment`
 *     (role + binding + optional policy + optional notes),
 *     `AndroidDeviceRetireRequest` (optional reason).
 *
 * No Android Activity / Fragment / Composable / View class names
 * surface here — capability + role + binding tokens are the only
 * mobile coupling.
 */

import type { components } from "@/contracts/types/android-device-management";
import type {
  ConsoleAndroidDeviceBindingType,
  ConsoleAndroidDeviceRole,
} from "./consoleAndroidDevicesSnapshot";

type AndroidDeviceAssignmentDto =
  components["schemas"]["AndroidDeviceAssignment"];
type AndroidDeviceRetireRequestDto =
  components["schemas"]["AndroidDeviceRetireRequest"];

/**
 * Canonical role → allowed binding types map. Enforced by the UI
 * and re-checked by the backend (canonical contract invariant).
 */
export const BINDING_TYPES_FOR_ROLE: Record<
  ConsoleAndroidDeviceRole,
  readonly ConsoleAndroidDeviceBindingType[]
> = {
  registrar: ["receptionPoint", "workstation"],
  vehicleVerifier: ["vehicle"],
};

/**
 * Operator-friendly labels for binding types. Source values stay
 * canonical (rendered as monospace chip next to the label).
 */
export const ANDROID_BINDING_LABELS: Record<
  ConsoleAndroidDeviceBindingType,
  string
> = {
  receptionPoint: "Reception point",
  workstation: "Workstation",
  vehicle: "Vehicle",
};

export type AssignmentValidationIssue =
  | { code: "role_missing" }
  | { code: "binding_missing" }
  | { code: "binding_incompatible"; role: ConsoleAndroidDeviceRole }
  | { code: "anchor_missing" };

export type AssignmentDraft = {
  role: ConsoleAndroidDeviceRole | null;
  bindingType: ConsoleAndroidDeviceBindingType | null;
  anchorId: string;
  notes: string;
};

export function emptyAssignmentDraft(): AssignmentDraft {
  return {
    role: null,
    bindingType: null,
    anchorId: "",
    notes: "",
  };
}

/**
 * Validate the assignment draft against the canonical invariants.
 * Returns a stable list of issues; empty list means the draft is
 * ready to dispatch.
 *
 * Order:
 *   1. role required;
 *   2. binding type required;
 *   3. binding type compatible with role;
 *   4. anchor id non-empty after trim.
 */
export function validateAssignmentDraft(
  draft: AssignmentDraft,
): AssignmentValidationIssue[] {
  const issues: AssignmentValidationIssue[] = [];
  if (!draft.role) {
    issues.push({ code: "role_missing" });
  }
  if (!draft.bindingType) {
    issues.push({ code: "binding_missing" });
  }
  if (
    draft.role &&
    draft.bindingType &&
    !BINDING_TYPES_FOR_ROLE[draft.role].includes(draft.bindingType)
  ) {
    issues.push({
      code: "binding_incompatible",
      role: draft.role,
    });
  }
  if (draft.anchorId.trim().length === 0) {
    issues.push({ code: "anchor_missing" });
  }
  return issues;
}

/**
 * Build the canonical `AndroidDeviceAssignment` body from the
 * validated draft. Caller MUST ensure
 * `validateAssignmentDraft(draft).length === 0` before invoking.
 * Returns a body that conforms to the operator-side write shape:
 * the optional `policy` is omitted (use the existing capability
 * policy editor to change policy; assign-only here means "set
 * role+binding, keep existing policy intact" per canonical
 * semantics).
 */
export function buildAssignmentBody(
  draft: AssignmentDraft,
): AndroidDeviceAssignmentDto {
  if (!draft.role || !draft.bindingType) {
    throw new Error(
      "buildAssignmentBody: draft is invalid — role + binding required",
    );
  }
  const trimmedNotes = draft.notes.trim();
  return {
    role: draft.role,
    binding: {
      type: draft.bindingType,
      anchorId: draft.anchorId.trim(),
    },
    ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
  };
}

export type RetireDraft = {
  reason: string;
};

export function emptyRetireDraft(): RetireDraft {
  return { reason: "" };
}

/**
 * Build the canonical `AndroidDeviceRetireRequest` body. Trims
 * the operator audit reason; empty value collapses to canonical
 * "absent" semantics (field omitted entirely).
 */
export function buildRetireBody(
  draft: RetireDraft,
): AndroidDeviceRetireRequestDto {
  const trimmed = draft.reason.trim();
  return trimmed.length > 0 ? { reason: trimmed } : {};
}
