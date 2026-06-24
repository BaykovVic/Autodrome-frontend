"use client";

import { useMemo, useState } from "react";

import { Button, Modal } from "@/components";

import {
  ANDROID_CAPABILITY_LABELS,
  type ConsoleAndroidDevice,
  type ConsoleAndroidDeviceCapability,
  type ConsoleAndroidDeviceCapabilityPolicy,
} from "./consoleAndroidDevicesSnapshot";
import {
  ANDROID_CAPABILITIES,
  applyPolicyEdit,
  applyPreset,
  buildEditorDraft,
  CLEAR_ALL_PRESET,
  isCriticalCapability,
  REGISTRAR_PRESET,
  requiresConfirm,
  toggleCapability,
  VEHICLE_VERIFIER_PRESET,
  type AndroidPolicyEditorDraft,
} from "./androidPolicyEditorHelpers";
import styles from "./AndroidDevicePolicyEditor.module.css";

export type AndroidDevicePolicyEditorProps = {
  open: boolean;
  device: ConsoleAndroidDevice | null;
  /** Stable "now" timestamp injected for deterministic mock state. */
  now: string;
  onSave: (
    deviceId: string,
    nextPolicy: ConsoleAndroidDeviceCapabilityPolicy,
  ) => void;
  onClose: () => void;
};

function capabilityLabel(cap: ConsoleAndroidDeviceCapability): string {
  return ANDROID_CAPABILITY_LABELS[cap] ?? cap;
}

/**
 * Mock-first capability policy editor.
 *
 * Renders read-only `policyVersion` + role + canonical capability
 * checkboxes (canonical token visible as monospace chip) +
 * `policyReason` textarea + presets (registrar / vehicleVerifier /
 * clear all). On save, runs `requiresConfirm` against the previous
 * disabled-set; if true, shows a safe-confirm dialog before
 * committing the new policy through `onSave`.
 *
 * No live API calls. Backend wiring lands in
 * `feature/frontend-android-device-management-live-api-integration`.
 *
 * No Android Activity / Fragment / Composable / View class names
 * are introduced — capability tokens are the only mobile coupling
 * per the cross-scope decision.
 */
export function AndroidDevicePolicyEditor({
  open,
  device,
  now,
  onSave,
  onClose,
}: AndroidDevicePolicyEditorProps) {
  const [draft, setDraft] = useState<AndroidPolicyEditorDraft>(() =>
    buildEditorDraft(device?.policy),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Track the (deviceId, open) pair we initialised `draft` from.
  // When either changes we reset the draft *during render* (React's
  // "Adjusting state while rendering" pattern), which avoids the
  // useEffect cascade lint and runs before the editor body sees a
  // stale snapshot.
  const editingKey = open && device ? device.id : null;
  const [initialisedFor, setInitialisedFor] = useState<string | null>(
    editingKey,
  );
  if (editingKey !== initialisedFor) {
    setInitialisedFor(editingKey);
    setDraft(buildEditorDraft(device?.policy));
    setConfirmOpen(false);
  }

  const prevDisabled = device?.policy?.disabledCapabilities ?? [];
  const needsConfirm = useMemo(
    () => requiresConfirm(prevDisabled, draft.disabledCapabilities),
    [prevDisabled, draft.disabledCapabilities],
  );

  if (!device) return null;

  const disabledSet = new Set(draft.disabledCapabilities);

  function commitSave() {
    if (!device) return;
    const next = applyPolicyEdit(device.policy, draft, now);
    onSave(device.id, next);
    setConfirmOpen(false);
    onClose();
  }

  function handleSaveClick() {
    if (needsConfirm) {
      setConfirmOpen(true);
    } else {
      commitSave();
    }
  }

  const role = device.role ?? "—";

  // Single modal switches its body between editor and confirm
  // views. Two separate <Modal> elements would race on the
  // `close` event during the confirm transition — when the main
  // modal closed, its onClose would propagate to the editor's
  // onClose and close the whole editor before the confirm modal
  // could open.
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={
        confirmOpen
          ? "Confirm policy change"
          : `Edit capability policy · ${device.id}`
      }
    >
      {confirmOpen ? (
        <div className={styles.confirmBody}>
          <h2 className={styles.confirmTitle}>Confirm policy change</h2>
          <p className={styles.confirmText}>
            This change disables one or more critical capabilities or
            applies a near-full surface lock. Operators relying on this
            device may lose access to their primary workflow until the
            policy is updated again.
          </p>
          <p className={styles.confirmText}>
            Disabled capabilities after save:
          </p>
          <ul className={styles.confirmList}>
            {draft.disabledCapabilities.map((cap) => (
              <li key={cap}>
                <strong>{capabilityLabel(cap)}</strong>{" "}
                <span className={styles.capabilityCode}>({cap})</span>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={commitSave}
            >
              Confirm &amp; save
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.editor}>
          <div>
            <h2 className={styles.title}>Edit capability policy</h2>
            <p className={styles.subtitle}>
              Mock-first editor. Backend wiring lands with the upcoming
              live API integration feature; `policyVersion` is owned by
              the backend in live mode.
            </p>
          </div>

          <dl className={styles.deviceMeta}>
            <dt className={styles.deviceMetaLabel}>Device</dt>
            <dd
              className={`${styles.deviceMetaValue} ${styles.deviceMetaMono}`}
            >
              {device.id}
            </dd>
            <dt className={styles.deviceMetaLabel}>Role</dt>
            <dd className={styles.deviceMetaValue}>{role}</dd>
            <dt className={styles.deviceMetaLabel}>
              Current policyVersion
            </dt>
            <dd className={styles.deviceMetaValue}>
              <span className={styles.versionPill}>
                v{device.policy?.policyVersion ?? 0}
              </span>
            </dd>
          </dl>

          <div>
            <div className={styles.sectionTitle}>Presets</div>
            <div className={styles.presetRow}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDraft((d) => applyPreset(d, REGISTRAR_PRESET))
                }
                title="Apply the canonical registrar preset (keeps enrollmentCapture active, disables verifier-only and operator-sensitive surfaces)."
              >
                Apply registrar preset
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDraft((d) => applyPreset(d, VEHICLE_VERIFIER_PRESET))
                }
                title="Apply the canonical vehicleVerifier preset (keeps verification surfaces active, disables enrollment and operator-sensitive surfaces)."
              >
                Apply vehicleVerifier preset
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDraft((d) => applyPreset(d, CLEAR_ALL_PRESET))
                }
                title="Clear the disabled set — device gets full role-default access."
              >
                Clear all
              </Button>
            </div>
          </div>

          <div>
            <div className={styles.sectionTitle}>
              disabledCapabilities
            </div>
            <ul className={styles.capabilityList}>
              {ANDROID_CAPABILITIES.map((cap) => {
                const checked = disabledSet.has(cap);
                const critical = isCriticalCapability(cap);
                const id = `policy-cap-${cap}`;
                return (
                  <li key={cap} className={styles.capabilityRow}>
                    <input
                      id={id}
                      type="checkbox"
                      className={styles.capabilityCheckbox}
                      checked={checked}
                      onChange={() =>
                        setDraft((d) => toggleCapability(d, cap))
                      }
                    />
                    <label
                      htmlFor={id}
                      className={styles.capabilityText}
                    >
                      <span className={styles.capabilityLabel}>
                        {capabilityLabel(cap)}
                        {critical ? (
                          <span
                            className={styles.criticalChip}
                            aria-label="critical capability"
                          >
                            critical
                          </span>
                        ) : null}
                      </span>
                      <span className={styles.capabilityCode}>{cap}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.reasonField}>
            <label
              htmlFor="policy-reason-input"
              className={styles.reasonLabel}
            >
              policyReason
            </label>
            <textarea
              id="policy-reason-input"
              className={styles.reasonTextarea}
              value={draft.policyReason}
              onChange={(e) =>
                setDraft((d) => ({ ...d, policyReason: e.target.value }))
              }
              placeholder="Operator audit note. Forwarded to the device. MUST NOT contain candidate PII."
              maxLength={2000}
            />
            <span className={styles.reasonHint}>
              Empty value clears <code>policyReason</code> (canonical
              &ldquo;absent&rdquo; semantics).
            </span>
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveClick}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
