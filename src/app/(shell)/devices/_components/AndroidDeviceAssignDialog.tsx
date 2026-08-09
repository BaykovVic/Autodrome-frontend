"use client";

import { useState } from "react";

import { Button, Modal } from "@/components";
import { classifyError } from "@/api/error-taxonomy";
import type { components } from "@/contracts/types/android-device-management";

import type {
  ConsoleAndroidDevice,
  ConsoleAndroidDeviceBindingType,
  ConsoleAndroidDeviceRole,
} from "./consoleAndroidDevicesSnapshot";
import {
  ANDROID_BINDING_LABELS,
  BINDING_TYPES_FOR_ROLE,
  buildAssignmentBody,
  emptyAssignmentDraft,
  validateAssignmentDraft,
  type AssignmentDraft,
} from "./androidAssignmentHelpers";
import {
  useVehicleAnchorOptions,
  type VehicleAnchorOptionsLoader,
} from "./useVehicleAnchorOptions";
import { vehicleAnchorLabel } from "./vehicleAnchorOptions";
import styles from "./AndroidDeviceCommandDialogs.module.css";

type AndroidDeviceAssignmentDto =
  components["schemas"]["AndroidDeviceAssignment"];

export type AndroidDeviceAssignDialogProps = {
  open: boolean;
  device: ConsoleAndroidDevice | null;
  onSubmit: (
    deviceId: string,
    assignment: AndroidDeviceAssignmentDto,
  ) => void;
  onClose: () => void;
  /**
   * Override for the `vehicle` anchor picker source. Production
   * leaves it unset — live mode reads `GET /vehicles`, mock mode reads
   * the vehicles-workspace fixtures. Tests inject deterministic
   * options (including failures).
   */
  vehicleOptionsLoader?: VehicleAnchorOptionsLoader;
};

const ROLE_OPTIONS: readonly ConsoleAndroidDeviceRole[] = [
  "registrar",
  "vehicleVerifier",
];

const ROLE_LABEL: Record<ConsoleAndroidDeviceRole, string> = {
  registrar: "Registrar",
  vehicleVerifier: "Vehicle verifier",
};

/**
 * Assign command dialog.
 *
 * Seeds the draft from the current device's role + binding when
 * present (re-assignment scenario) or empty (first-time
 * pending → active). Role select drives the binding-type options
 * via the canonical `BINDING_TYPES_FOR_ROLE` map; switching role
 * clears an incompatible binding-type. Save dispatches the
 * canonical `AndroidDeviceAssignment` body through `onSubmit`
 * (the parent hook decides mock vs live).
 *
 * Anchor input depends on the binding type:
 *
 *   - `vehicle` (the `vehicleVerifier` target) → picker over the
 *     vehicle registry. The operator selects a plate, the dialog
 *     submits the canonical `vehicleId`. Registry failures render
 *     through the shared error taxonomy with a retry — the picker
 *     never falls back to free-text entry, and never shows an empty
 *     list as if no vehicles existed.
 *   - `receptionPoint` / `workstation` → UUID text input, because
 *     reference-data-service has no picker endpoint wired yet.
 *
 * No Android Activity / Fragment / Composable / View class names
 * surface — canonical role + binding tokens are the only mobile
 * coupling, exactly per cross-scope decision.
 */
export function AndroidDeviceAssignDialog({
  open,
  device,
  onSubmit,
  onClose,
  vehicleOptionsLoader,
}: AndroidDeviceAssignDialogProps) {
  function seedDraft(): AssignmentDraft {
    if (!device) return emptyAssignmentDraft();
    return {
      role: device.role ?? null,
      bindingType: device.binding?.type ?? null,
      anchorId: device.binding?.anchorId ?? "",
      notes: "",
    };
  }

  const [draft, setDraft] = useState<AssignmentDraft>(seedDraft);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Adjust state while rendering — reset the draft + submitAttempted
  // every time the dialog opens for a different device (avoids the
  // useEffect cascade lint per react-hooks rule).
  const editingKey = open && device ? device.id : null;
  const [initialisedFor, setInitialisedFor] = useState<string | null>(
    editingKey,
  );
  if (editingKey !== initialisedFor) {
    setInitialisedFor(editingKey);
    setDraft(seedDraft());
    setSubmitAttempted(false);
  }

  // The vehicle registry is only read when the operator actually
  // needs a vehicle anchor — a registrar assignment costs no
  // `vehicle-service` call.
  const needsVehiclePicker = open && draft.bindingType === "vehicle";
  const vehicles = useVehicleAnchorOptions({
    enabled: needsVehiclePicker,
    loader: vehicleOptionsLoader,
  });

  if (!device) return null;

  const issues = validateAssignmentDraft(draft);
  const hasIssues = issues.length > 0;
  const visibleIssues = submitAttempted ? issues : [];

  const roleIssue = visibleIssues.find((i) => i.code === "role_missing");
  const bindingMissingIssue = visibleIssues.find(
    (i) => i.code === "binding_missing",
  );
  const bindingIncompatibleIssue = visibleIssues.find(
    (i) => i.code === "binding_incompatible",
  );
  const anchorMissingIssue = visibleIssues.find(
    (i) => i.code === "anchor_missing",
  );
  const anchorInvalidUuidIssue = visibleIssues.find(
    (i) => i.code === "anchor_invalid_uuid",
  );
  const anchorIssue = anchorMissingIssue ?? anchorInvalidUuidIssue;

  // Registry failures go through the shared taxonomy: 403 stays a
  // forbidden message, 503 a degraded one, and only retryable
  // categories get a retry control.
  const vehicleListProblem =
    vehicles.phase === "error" ? classifyError(vehicles.error) : null;
  // A device already bound to a vehicle that the registry no longer
  // returns keeps its current anchor visible instead of silently
  // resetting the field to "nothing selected".
  const currentAnchorMissingFromRegistry =
    draft.bindingType === "vehicle" &&
    draft.anchorId.length > 0 &&
    vehicles.phase === "ready" &&
    !vehicles.options.some((v) => v.vehicleId === draft.anchorId);

  function handleRoleChange(next: ConsoleAndroidDeviceRole) {
    setDraft((d) => {
      const allowed = BINDING_TYPES_FOR_ROLE[next];
      // Keep the binding type only if it remains compatible with
      // the new role; otherwise reset it so the operator picks
      // again.
      const keepBinding =
        d.bindingType !== null && allowed.includes(d.bindingType);
      return {
        ...d,
        role: next,
        bindingType: keepBinding ? d.bindingType : null,
        // A dropped binding type takes its anchor with it: an anchor
        // id belongs to the owning service of one specific binding
        // type and is meaningless under another.
        anchorId: keepBinding ? d.anchorId : "",
      };
    });
  }

  function handleBindingTypeChange(
    next: ConsoleAndroidDeviceBindingType,
  ) {
    setDraft((d) => ({
      ...d,
      bindingType: next,
      anchorId: d.bindingType === next ? d.anchorId : "",
    }));
  }

  function handleSave() {
    if (!device) return;
    setSubmitAttempted(true);
    if (hasIssues) return;
    const body = buildAssignmentBody(draft);
    onSubmit(device.id, body);
    onClose();
  }

  const bindingOptions = draft.role
    ? BINDING_TYPES_FOR_ROLE[draft.role]
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={`Assign Android device · ${device.id}`}
    >
      <div className={styles.dialog}>
        <div>
          <h2 className={styles.title}>Assign device</h2>
          <p className={styles.subtitle}>
            Set canonical role and binding. The capability policy
            is edited separately through the policy editor; this
            dialog only re-binds.
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
            htmlFor="assign-role-select"
          >
            Role
          </label>
          <select
            id="assign-role-select"
            className={styles.select}
            value={draft.role ?? ""}
            onChange={(e) =>
              handleRoleChange(
                e.target.value as ConsoleAndroidDeviceRole,
              )
            }
            aria-invalid={roleIssue ? "true" : undefined}
            aria-describedby={
              roleIssue ? "assign-role-error" : undefined
            }
          >
            <option value="" disabled>
              — pick a role —
            </option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]} ({r})
              </option>
            ))}
          </select>
          {roleIssue ? (
            <span id="assign-role-error" className={styles.fieldError}>
              Role is required.
            </span>
          ) : (
            <span className={styles.fieldHint}>
              <code>registrar</code> binds to{" "}
              <code>receptionPoint</code> or <code>workstation</code>;{" "}
              <code>vehicleVerifier</code> binds to{" "}
              <code>vehicle</code>.
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label
            className={styles.fieldLabel}
            htmlFor="assign-binding-type-select"
          >
            Binding type
          </label>
          <select
            id="assign-binding-type-select"
            className={styles.select}
            value={draft.bindingType ?? ""}
            onChange={(e) =>
              handleBindingTypeChange(
                e.target.value as ConsoleAndroidDeviceBindingType,
              )
            }
            disabled={!draft.role}
            aria-invalid={
              bindingMissingIssue || bindingIncompatibleIssue
                ? "true"
                : undefined
            }
            aria-describedby={
              bindingMissingIssue
                ? "assign-binding-error"
                : bindingIncompatibleIssue
                  ? "assign-binding-error"
                  : undefined
            }
          >
            <option value="" disabled>
              {draft.role
                ? "— pick a binding —"
                : "— pick a role first —"}
            </option>
            {bindingOptions.map((b) => (
              <option key={b} value={b}>
                {ANDROID_BINDING_LABELS[b]} ({b})
              </option>
            ))}
          </select>
          {bindingMissingIssue ? (
            <span
              id="assign-binding-error"
              className={styles.fieldError}
            >
              Binding type is required.
            </span>
          ) : bindingIncompatibleIssue ? (
            <span
              id="assign-binding-error"
              className={styles.fieldError}
            >
              Binding incompatible with role{" "}
              <code>{bindingIncompatibleIssue.role}</code>.
            </span>
          ) : null}
        </div>

        {draft.bindingType === "vehicle" ? (
          <div className={styles.field}>
            <label
              className={styles.fieldLabel}
              htmlFor="assign-vehicle-select"
            >
              Vehicle
            </label>
            {vehicles.phase === "loading" || vehicles.phase === "idle" ? (
              <p className={styles.fieldHint}>
                Loading vehicles from vehicle-service…
              </p>
            ) : vehicles.phase === "error" ? (
              <div className={styles.pickerProblem} role="alert">
                <span>
                  {vehicleListProblem?.title}:{" "}
                  {vehicleListProblem?.description}
                </span>
                {vehicleListProblem?.retryable ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={vehicles.reload}
                  >
                    Retry vehicle list
                  </Button>
                ) : null}
              </div>
            ) : vehicles.options.length === 0 ? (
              <p className={styles.pickerProblem}>
                vehicle-service returned no vehicles. Register a
                vehicle before binding a verification tablet to it.
              </p>
            ) : (
              <>
                <select
                  id="assign-vehicle-select"
                  className={styles.select}
                  value={draft.anchorId}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, anchorId: e.target.value }))
                  }
                  aria-invalid={anchorIssue ? "true" : undefined}
                  aria-describedby={
                    anchorIssue ? "assign-anchor-error" : undefined
                  }
                >
                  <option value="" disabled>
                    — pick a vehicle —
                  </option>
                  {currentAnchorMissingFromRegistry ? (
                    <option value={draft.anchorId}>
                      Current binding (not in the vehicle registry) ·{" "}
                      {draft.anchorId}
                    </option>
                  ) : null}
                  {vehicles.options.map((v) => (
                    <option
                      key={v.vehicleId}
                      value={v.vehicleId}
                      disabled={!v.bindable}
                    >
                      {vehicleAnchorLabel(v)}
                      {v.bindable ? "" : ` — ${v.statusLabel}`}
                    </option>
                  ))}
                </select>
                {anchorMissingIssue ? (
                  <span
                    id="assign-anchor-error"
                    className={styles.fieldError}
                  >
                    Pick the vehicle this tablet verifies.
                  </span>
                ) : (
                  <span className={styles.fieldHint}>
                    Live list from vehicle-service. The canonical{" "}
                    <code>vehicleId</code> of the chosen vehicle is
                    submitted as the binding anchor.
                  </span>
                )}
              </>
            )}
          </div>
        ) : (
        <div className={styles.field}>
          <label
            className={styles.fieldLabel}
            htmlFor="assign-anchor-id-input"
          >
            Anchor ID
          </label>
          <input
            id="assign-anchor-id-input"
            className={styles.input}
            value={draft.anchorId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, anchorId: e.target.value }))
            }
            placeholder="00000000-0000-0000-0000-000000000000 (canonical UUID — operator-friendly label NOT accepted)"
            aria-invalid={anchorIssue ? "true" : undefined}
            aria-describedby={
              anchorIssue ? "assign-anchor-error" : undefined
            }
          />
          {anchorMissingIssue ? (
            <span
              id="assign-anchor-error"
              className={styles.fieldError}
            >
              Anchor ID is required.
            </span>
          ) : anchorInvalidUuidIssue ? (
            <span
              id="assign-anchor-error"
              className={styles.fieldError}
            >
              Anchor ID must be a canonical UUID (the
              owning service&apos;s opaque reference). Operator-
              friendly labels live in the owning service and are
              not accepted here.
            </span>
          ) : (
            <span className={styles.fieldHint}>
              Opaque <strong>UUID</strong> reference into
              reference-data-service (no picker endpoint wired yet;{" "}
              <code>vehicle</code> anchors are picked from the live
              vehicle registry instead).
            </span>
          )}
        </div>
        )}

        <div className={styles.field}>
          <label
            className={styles.fieldLabel}
            htmlFor="assign-notes-textarea"
          >
            Operator audit notes
            <span className={styles.canonicalChip}>(optional)</span>
          </label>
          <textarea
            id="assign-notes-textarea"
            className={styles.textarea}
            value={draft.notes}
            onChange={(e) =>
              setDraft((d) => ({ ...d, notes: e.target.value }))
            }
            placeholder="Operator-side audit note. Not forwarded to the device."
            maxLength={2000}
          />
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
            onClick={handleSave}
            disabled={submitAttempted && hasIssues}
          >
            Save assignment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
