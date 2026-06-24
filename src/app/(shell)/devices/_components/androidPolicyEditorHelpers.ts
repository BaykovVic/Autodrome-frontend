/**
 * Pure helpers for the mock-first Android device capability
 * policy editor.
 *
 * No live API calls — this module only manipulates console-side
 * view-model values (`ConsoleAndroidDeviceCapabilityPolicy`). The
 * real backend mutation (`POST /admin/devices/{deviceId}/assign`
 * with an updated policy body) lands in
 * `feature/frontend-android-device-management-live-api-integration`.
 *
 * Canonical naming compliance (per cross-scope feature map):
 *
 *   - Capability source values stay canonical
 *     (`enrollmentCapture`, `verificationCapture`,
 *     `passiveFaceCheck`, `devicePairing`, `diagnostics`,
 *     `settings`). Operator-friendly labels live in
 *     `ANDROID_CAPABILITY_LABELS` (consumed by the modal UI).
 *   - Presets follow canonical role semantics from
 *     `cross-scope-feature-map`: `registrar` devices run the
 *     enrollment surface only; `vehicleVerifier` devices run the
 *     verification surfaces only — every other capability is
 *     listed in the preset's `disabledCapabilities`.
 *   - `policyVersion` is **backend-owned and monotonic** in the
 *     canonical contract. In mock mode the local editor bumps
 *     the version on save so the UI stays predictable; live
 *     wiring will replace the bumped value with the real backend
 *     response per `applyPolicyEdit` JSDoc.
 *
 * No Android Activity / Fragment / Composable / View class names
 * appear in this module — capability tokens are the only mobile
 * coupling, exactly per cross-scope decision.
 */

import type {
  ConsoleAndroidDeviceCapability,
  ConsoleAndroidDeviceCapabilityPolicy,
  ConsoleAndroidDeviceRole,
} from "./consoleAndroidDevicesSnapshot";

/**
 * Full canonical capability list as of the contracts-baseline
 * review. Order is operator-facing render order in the editor —
 * grouped by registrar-side / verifier-side / shared / sensitive.
 */
export const ANDROID_CAPABILITIES: readonly ConsoleAndroidDeviceCapability[] =
  [
    "enrollmentCapture",
    "verificationCapture",
    "passiveFaceCheck",
    "devicePairing",
    "diagnostics",
    "settings",
  ];

/**
 * Capabilities considered "critical" for the safe-confirm rule:
 *
 *   - `enrollmentCapture` / `verificationCapture` /
 *     `passiveFaceCheck` — disabling them blocks the device's
 *     primary face-capture workflow. Roles need at least one of
 *     these active to be useful.
 *   - `devicePairing` / `settings` — disabling them locks the
 *     device from operator-side reset / recovery affordances.
 *
 * `diagnostics` is intentionally excluded — it's an
 * operator-visible read-only screen on the device; disabling
 * it does not block the user-facing workflow.
 */
const CRITICAL_SET: ReadonlySet<ConsoleAndroidDeviceCapability> = new Set([
  "enrollmentCapture",
  "verificationCapture",
  "passiveFaceCheck",
  "devicePairing",
  "settings",
]);

export function isCriticalCapability(
  capability: ConsoleAndroidDeviceCapability,
): boolean {
  return CRITICAL_SET.has(capability);
}

/**
 * Preset for a `registrar` device — keeps the enrollment surface
 * active, disables verifier-only and operator-sensitive surfaces.
 * Mirrors the canonical role description in
 * `AndroidDeviceCapability` OpenAPI.
 */
export const REGISTRAR_PRESET: readonly ConsoleAndroidDeviceCapability[] = [
  "verificationCapture",
  "passiveFaceCheck",
  "diagnostics",
  "settings",
];

/**
 * Preset for a `vehicleVerifier` device — keeps the verification
 * surfaces active, disables enrollment and operator-sensitive
 * surfaces.
 */
export const VEHICLE_VERIFIER_PRESET: readonly ConsoleAndroidDeviceCapability[] =
  ["enrollmentCapture", "devicePairing", "settings"];

/**
 * Empty-disabled preset — clears the disabled set so the device
 * runs every capability its role permits ("everything not in the
 * disabled set is allowed" per canonical policy semantics).
 */
export const CLEAR_ALL_PRESET: readonly ConsoleAndroidDeviceCapability[] = [];

/** Resolve a role to its canonical preset. */
export function presetForRole(
  role: ConsoleAndroidDeviceRole,
): readonly ConsoleAndroidDeviceCapability[] {
  return role === "registrar"
    ? REGISTRAR_PRESET
    : VEHICLE_VERIFIER_PRESET;
}

/**
 * Operator-facing draft state captured by the editor. Keep it
 * minimal — the editor never mutates `policyVersion` directly
 * (backend owns it); `disabledCapabilities` is the only operator
 * input besides `policyReason`.
 */
export type AndroidPolicyEditorDraft = {
  disabledCapabilities: readonly ConsoleAndroidDeviceCapability[];
  policyReason: string;
};

/**
 * Build the initial draft from the device's current policy. A
 * device without a policy (pending state) opens the editor with
 * an empty draft. Returns plain arrays so the editor's React
 * state can mutate freely without aliasing the snapshot.
 */
export function buildEditorDraft(
  policy: ConsoleAndroidDeviceCapabilityPolicy | undefined,
): AndroidPolicyEditorDraft {
  return {
    disabledCapabilities: [...(policy?.disabledCapabilities ?? [])],
    policyReason: policy?.policyReason ?? "",
  };
}

/**
 * Toggle a capability in the draft's `disabledCapabilities`
 * list. Pure — returns a new draft.
 */
export function toggleCapability(
  draft: AndroidPolicyEditorDraft,
  capability: ConsoleAndroidDeviceCapability,
): AndroidPolicyEditorDraft {
  const set = new Set(draft.disabledCapabilities);
  if (set.has(capability)) {
    set.delete(capability);
  } else {
    set.add(capability);
  }
  return {
    ...draft,
    disabledCapabilities: ANDROID_CAPABILITIES.filter((c) => set.has(c)),
  };
}

/**
 * Apply a preset by replacing the `disabledCapabilities` set
 * with the preset's content. Reason is preserved — operator
 * keeps their audit note across preset switches.
 */
export function applyPreset(
  draft: AndroidPolicyEditorDraft,
  preset: readonly ConsoleAndroidDeviceCapability[],
): AndroidPolicyEditorDraft {
  return {
    ...draft,
    disabledCapabilities: [...preset],
  };
}

/**
 * Decide whether a safe-confirm dialog is needed before saving.
 * The rule mirrors the spec:
 *
 *   1. Disable-all (or near-full) — disabling **all** canonical
 *      capabilities (or all but `diagnostics`) on a working
 *      device is operationally destructive.
 *   2. Any newly-disabled critical capability (per
 *      `isCriticalCapability`).
 *
 * Re-enabling a critical capability does NOT trigger confirm —
 * that's an additive change that restores operator workflows.
 */
export function requiresConfirm(
  prev: readonly ConsoleAndroidDeviceCapability[],
  next: readonly ConsoleAndroidDeviceCapability[],
): boolean {
  const prevSet = new Set(prev);
  const newlyDisabled = next.filter((c) => !prevSet.has(c));
  const hasCriticalAdd = newlyDisabled.some(isCriticalCapability);
  if (hasCriticalAdd) return true;
  // Disable-all heuristic: the next set covers every critical
  // capability AND at least 5 of 6 canonical capabilities.
  const nextSet = new Set(next);
  const criticalCovered = Array.from(CRITICAL_SET).every((c) =>
    nextSet.has(c),
  );
  if (criticalCovered && next.length >= 5) return true;
  return false;
}

/**
 * Produce the next `ConsoleAndroidDeviceCapabilityPolicy` value
 * from a saved draft.
 *
 * `policyVersion`:
 *   - Mock-mode: bump prev + 1 (or `1` if no previous policy).
 *     The canonical contract requires monotonic version stamps,
 *     so the editor preserves that invariant locally for
 *     predictable UI behaviour.
 *   - Live-mode (future): the real backend response replaces this
 *     value entirely — see live-integration follow-up.
 *
 * `updatedAt`:
 *   - Mock-mode: callers supply a stable "now" timestamp so test
 *     output is deterministic. The function never reads
 *     `Date.now()` itself.
 *   - Live-mode (future): backend stamps this value.
 *
 * `policyReason`:
 *   - Trimmed; empty string collapses to `undefined` per
 *     canonical semantics ("absent" not "empty").
 */
export function applyPolicyEdit(
  prev: ConsoleAndroidDeviceCapabilityPolicy | undefined,
  draft: AndroidPolicyEditorDraft,
  now: string,
): ConsoleAndroidDeviceCapabilityPolicy {
  const reasonTrimmed = draft.policyReason.trim();
  return {
    policyVersion: (prev?.policyVersion ?? 0) + 1,
    disabledCapabilities: [...draft.disabledCapabilities],
    ...(reasonTrimmed.length > 0
      ? { policyReason: reasonTrimmed }
      : {}),
    updatedAt: now,
  };
}
