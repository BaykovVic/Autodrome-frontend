"use client";

import { useState } from "react";

import { Button, Modal } from "@/components";
import type { components } from "@/contracts/types/android-device-management";

import type { ConsoleAndroidDevice } from "./consoleAndroidDevicesSnapshot";
import {
  buildRetireBody,
  emptyRetireDraft,
  type RetireDraft,
} from "./androidAssignmentHelpers";
import styles from "./AndroidDeviceCommandDialogs.module.css";

type AndroidDeviceRetireRequestDto =
  components["schemas"]["AndroidDeviceRetireRequest"];

export type AndroidDeviceRetireDialogProps = {
  open: boolean;
  device: ConsoleAndroidDevice | null;
  onSubmit: (
    deviceId: string,
    request: AndroidDeviceRetireRequestDto,
  ) => void;
  onClose: () => void;
};

/**
 * Mock-first retire command dialog.
 *
 * Two-step flow inside a single modal (avoids the close-cascade
 * race between two modal elements): operator first edits an
 * optional audit reason, clicks "Retire device", then sees a
 * safe-confirm view explaining the terminal nature of the
 * transition. "Confirm & retire" dispatches the canonical
 * `AndroidDeviceRetireRequest` body through `onSubmit`; "Keep
 * editing" returns to the reason form.
 *
 * Retire is **terminal** per canonical lifecycle — once a device
 * is retired its token is revoked and no further self-state or
 * heartbeat calls are accepted. The safe-confirm view spells
 * this out so the operator can't fat-finger the action.
 */
export function AndroidDeviceRetireDialog({
  open,
  device,
  onSubmit,
  onClose,
}: AndroidDeviceRetireDialogProps) {
  const [draft, setDraft] = useState<RetireDraft>(emptyRetireDraft);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Adjust state while rendering — reset reason + confirm state
  // every time the dialog opens for a different device.
  const editingKey = open && device ? device.id : null;
  const [initialisedFor, setInitialisedFor] = useState<string | null>(
    editingKey,
  );
  if (editingKey !== initialisedFor) {
    setInitialisedFor(editingKey);
    setDraft(emptyRetireDraft());
    setConfirmOpen(false);
  }

  if (!device) return null;

  function commitRetire() {
    if (!device) return;
    const body = buildRetireBody(draft);
    onSubmit(device.id, body);
    setConfirmOpen(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={
        confirmOpen
          ? "Confirm retire"
          : `Retire Android device · ${device.id}`
      }
    >
      {confirmOpen ? (
        <div className={styles.dialog}>
          <h2 className={styles.title}>Confirm retire</h2>
          <p className={styles.confirmText}>
            Retire is <strong>terminal</strong>. Once the device
            transitions to <code>retired</code>, its device token
            is revoked and the backend stops accepting further
            self-state or heartbeat calls from it. Re-using the
            device requires a new registration round-trip.
          </p>
          {draft.reason.trim().length > 0 ? (
            <p className={styles.confirmText}>
              <strong>Audit reason:</strong> {draft.reason.trim()}
            </p>
          ) : (
            <p className={styles.confirmText}>
              <strong>Audit reason:</strong> (none)
            </p>
          )}
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
              onClick={commitRetire}
            >
              Confirm &amp; retire
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.dialog}>
          <div>
            <h2 className={styles.title}>Retire device</h2>
            <p className={styles.subtitle}>
              Terminal lifecycle transition. Operator audit reason
              is optional but recommended.
            </p>
          </div>

          <dl className={styles.deviceMeta}>
            <dt className={styles.deviceMetaLabel}>Device</dt>
            <dd
              className={`${styles.deviceMetaValue} ${styles.deviceMetaMono}`}
            >
              {device.id}
            </dd>
            <dt className={styles.deviceMetaLabel}>Current status</dt>
            <dd className={styles.deviceMetaValue}>
              {device.statusLabel}
            </dd>
          </dl>

          <div className={styles.field}>
            <label
              className={styles.fieldLabel}
              htmlFor="retire-reason-textarea"
            >
              Audit reason
              <span className={styles.canonicalChip}>(optional)</span>
            </label>
            <textarea
              id="retire-reason-textarea"
              className={styles.textarea}
              value={draft.reason}
              onChange={(e) =>
                setDraft({ reason: e.target.value })
              }
              placeholder="Operator-side audit note for the retirement. Forwarded to the backend; not sent to the device."
              maxLength={2000}
            />
            <span className={styles.fieldHint}>
              Empty value collapses to canonical &ldquo;absent&rdquo;
              semantics (<code>reason</code> field omitted).
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
              onClick={() => setConfirmOpen(true)}
            >
              Retire device
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
