"use client";

import { useState, type FormEvent } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  Input,
  Modal,
  Select,
  StatusBadge,
  ValidationErrors,
  type ValidationIssue,
} from "@/components";
import type { components } from "@/contracts/types/vehicle";
import styles from "./VehicleRegisterForm.module.css";

type VehicleRegistration = components["schemas"]["VehicleRegistration"];
type VehicleType = components["schemas"]["VehicleType"];
type Vehicle = components["schemas"]["Vehicle"];

type FormShape = {
  plateNumber: string;
  type: VehicleType;
  model: string;
  manufactureYear: string;
  vin: string;
};

const EMPTY_FORM: FormShape = {
  plateNumber: "",
  type: "passenger",
  model: "",
  manufactureYear: "",
  vin: "",
};

function buildPayload(form: FormShape): VehicleRegistration {
  const payload: VehicleRegistration = {
    plateNumber: form.plateNumber.trim(),
    type: form.type,
    model: form.model.trim(),
  };
  if (form.manufactureYear.trim()) {
    const parsed = Number(form.manufactureYear);
    if (Number.isFinite(parsed)) payload.manufactureYear = parsed;
  }
  if (form.vin.trim()) payload.vin = form.vin.trim();
  return payload;
}

function validate(form: FormShape): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!form.plateNumber.trim()) {
    issues.push({ field: "plateNumber", message: "Plate number is required" });
  }
  if (!form.model.trim()) {
    issues.push({ field: "model", message: "Model is required" });
  }
  if (form.manufactureYear.trim() && !Number.isInteger(Number(form.manufactureYear))) {
    issues.push({
      field: "manufactureYear",
      message: "Manufacture year must be an integer",
    });
  }
  return issues;
}

type Props = {
  api: AutodromeApi;
  open: boolean;
  onClose: () => void;
  onSuccess?: (vehicle: Vehicle) => void;
};

export function VehicleRegisterForm({
  api,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<FormShape>(EMPTY_FORM);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<unknown | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  function update<K extends keyof FormShape>(key: K, value: FormShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setIssues([]);
    setServerError(null);
    setSuccessId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();

    const nextIssues = validate(form);
    setIssues(nextIssues);
    if (nextIssues.length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.vehicle.POST("/vehicles", {
        params: {
          header: {
            "Idempotency-Key": crypto.randomUUID(),
          },
        },
        body: buildPayload(form),
      });
      const vehicle = data as Vehicle | undefined;
      if (vehicle?.vehicleId) {
        setSuccessId(vehicle.vehicleId);
        setForm(EMPTY_FORM);
        onSuccess?.(vehicle);
      }
    } catch (error) {
      setServerError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      ariaLabel="Register a new vehicle"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <h2 className={styles.title}>Register vehicle</h2>
          <p className={styles.subtitle}>
            Payload shape follows
            <span className={styles.mono}> VehicleRegistration</span>
            from vehicle-service OpenAPI contract.
          </p>
        </header>

        {issues.length > 0 ? <ValidationErrors issues={issues} /> : null}
        {serverError ? <ApiErrorView error={serverError} /> : null}
        {successId ? (
          <div className={styles.success}>
            <StatusBadge variant="success">created</StatusBadge>
            <span>
              New vehicle id <span className={styles.mono}>{successId}</span>
            </span>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Input
            id="plateNumber"
            label="Plate number"
            required
            value={form.plateNumber}
            onChange={(e) => update("plateNumber", e.target.value)}
            invalid={issues.some((i) => i.field === "plateNumber")}
          />
          <Select
            id="vehicleType"
            label="Type"
            value={form.type}
            onChange={(e) => update("type", e.target.value as VehicleType)}
          >
            <option value="passenger">passenger</option>
            <option value="truck">truck</option>
            <option value="motorcycle">motorcycle</option>
            <option value="bus">bus</option>
          </Select>
          <Input
            id="model"
            label="Model"
            required
            value={form.model}
            onChange={(e) => update("model", e.target.value)}
            invalid={issues.some((i) => i.field === "model")}
          />
          <Input
            id="manufactureYear"
            label="Manufacture year (optional)"
            value={form.manufactureYear}
            onChange={(e) => update("manufactureYear", e.target.value)}
            invalid={issues.some((i) => i.field === "manufactureYear")}
            hint="Integer year, e.g. 2024"
          />
          <Input
            id="vin"
            label="VIN (optional)"
            value={form.vin}
            onChange={(e) => update("vin", e.target.value)}
          />
        </div>

        <footer className={styles.footer}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Register"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
