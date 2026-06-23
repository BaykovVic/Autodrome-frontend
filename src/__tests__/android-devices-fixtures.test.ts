import { describe, expect, it } from "vitest";

import {
  __ANDROID_DEVICES_FIXTURE__,
  consoleAndroidDevicesFor,
} from "@/app/(shell)/devices/_components/consoleAndroidDevicesFixtures";

describe("consoleAndroidDevicesFor: default scenario", () => {
  const snapshot = consoleAndroidDevicesFor("normal");

  it("contains at least one device in each lifecycle state", () => {
    const statuses = new Set(snapshot.devices.map((d) => d.status));
    expect(statuses.has("pending")).toBe(true);
    expect(statuses.has("active")).toBe(true);
    expect(statuses.has("retired")).toBe(true);
  });

  it("totals match the rendered device list", () => {
    expect(snapshot.totals.devices).toBe(snapshot.devices.length);
    expect(snapshot.totals.pending).toBe(
      snapshot.devices.filter((d) => d.status === "pending").length,
    );
    expect(snapshot.totals.active).toBe(
      snapshot.devices.filter((d) => d.status === "active").length,
    );
    expect(snapshot.totals.retired).toBe(
      snapshot.devices.filter((d) => d.status === "retired").length,
    );
  });

  it("uses canonical role and binding type strings", () => {
    for (const d of snapshot.devices) {
      if (d.role !== undefined) {
        expect(["registrar", "vehicleVerifier"]).toContain(d.role);
      }
      if (d.binding) {
        expect(["receptionPoint", "workstation", "vehicle"]).toContain(
          d.binding.type,
        );
      }
    }
  });

  it("enforces canonical binding invariants: registrar → receptionPoint|workstation, vehicleVerifier → vehicle", () => {
    for (const d of snapshot.devices) {
      if (!d.binding) continue;
      if (d.role === "registrar") {
        expect(["receptionPoint", "workstation"]).toContain(
          d.binding.type,
        );
      }
      if (d.role === "vehicleVerifier") {
        expect(d.binding.type).toBe("vehicle");
      }
    }
  });

  it("active devices carry a capability policy with monotonic version ≥ 1", () => {
    const active = snapshot.devices.filter((d) => d.status === "active");
    for (const d of active) {
      expect(d.policy).toBeDefined();
      expect(d.policy!.policyVersion).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(d.policy!.disabledCapabilities)).toBe(true);
    }
  });

  it("pending devices do not carry a role or capability policy", () => {
    const pending = snapshot.devices.filter((d) => d.status === "pending");
    for (const d of pending) {
      expect(d.role).toBeUndefined();
      expect(d.policy).toBeUndefined();
    }
  });

  it("retired devices carry retiredAt timestamp", () => {
    const retired = snapshot.devices.filter((d) => d.status === "retired");
    for (const d of retired) {
      expect(typeof d.retiredAt).toBe("string");
      expect(d.retiredAt!.length).toBeGreaterThan(0);
    }
  });

  it("every device exposes platform metadata required by the contract", () => {
    for (const d of snapshot.devices) {
      expect(d.platform.manufacturer.length).toBeGreaterThan(0);
      expect(d.platform.model.length).toBeGreaterThan(0);
      expect(d.platform.osVersion.length).toBeGreaterThan(0);
      expect(d.platform.appVersion.length).toBeGreaterThan(0);
    }
  });

  it("disabledCapabilities lists use canonical capability strings", () => {
    const knownCaps = new Set([
      "enrollmentCapture",
      "verificationCapture",
      "passiveFaceCheck",
      "devicePairing",
      "diagnostics",
      "settings",
    ]);
    for (const d of snapshot.devices) {
      for (const cap of d.policy?.disabledCapabilities ?? []) {
        expect(knownCaps.has(cap)).toBe(true);
      }
    }
  });

  it("statusLabel mirrors canonical status string (no operator-facing renaming)", () => {
    for (const d of snapshot.devices) {
      expect(d.statusLabel).toBe(d.status);
    }
  });
});

describe("consoleAndroidDevicesFor: alternative scenarios", () => {
  it("empty scenario returns no devices", () => {
    const snap = consoleAndroidDevicesFor("empty");
    expect(snap.devices).toEqual([]);
    expect(snap.totals).toEqual({
      devices: 0,
      pending: 0,
      active: 0,
      retired: 0,
    });
  });

  it("service-degraded scenario returns empty list (matches future 503 surface)", () => {
    const snap = consoleAndroidDevicesFor("service-degraded");
    expect(snap.devices).toEqual([]);
  });

  it("exam-in-progress and violations-detected fall back to default seed", () => {
    expect(consoleAndroidDevicesFor("exam-in-progress").devices.length).toBe(
      __ANDROID_DEVICES_FIXTURE__.length,
    );
    expect(
      consoleAndroidDevicesFor("violations-detected").devices.length,
    ).toBe(__ANDROID_DEVICES_FIXTURE__.length);
  });
});
