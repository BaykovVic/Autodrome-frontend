import { describe, expect, it } from "vitest";

import {
  ANDROID_CAPABILITIES,
  applyPolicyEdit,
  applyPreset,
  buildEditorDraft,
  CLEAR_ALL_PRESET,
  isCriticalCapability,
  presetForRole,
  REGISTRAR_PRESET,
  requiresConfirm,
  toggleCapability,
  VEHICLE_VERIFIER_PRESET,
} from "@/app/(shell)/devices/_components/androidPolicyEditorHelpers";

const NOW = "2026-06-24T00:00:00Z";

describe("ANDROID_CAPABILITIES", () => {
  it("contains the six canonical capabilities in canonical order", () => {
    expect([...ANDROID_CAPABILITIES]).toEqual([
      "enrollmentCapture",
      "verificationCapture",
      "passiveFaceCheck",
      "devicePairing",
      "diagnostics",
      "settings",
    ]);
  });
});

describe("isCriticalCapability", () => {
  it("marks the five operator-critical capabilities", () => {
    expect(isCriticalCapability("enrollmentCapture")).toBe(true);
    expect(isCriticalCapability("verificationCapture")).toBe(true);
    expect(isCriticalCapability("passiveFaceCheck")).toBe(true);
    expect(isCriticalCapability("devicePairing")).toBe(true);
    expect(isCriticalCapability("settings")).toBe(true);
  });

  it("does NOT flag diagnostics as critical (operator-visible only)", () => {
    expect(isCriticalCapability("diagnostics")).toBe(false);
  });
});

describe("presetForRole", () => {
  it("registrar preset disables verifier + sensitive surfaces", () => {
    expect([...REGISTRAR_PRESET]).toEqual([
      "verificationCapture",
      "passiveFaceCheck",
      "diagnostics",
      "settings",
    ]);
    expect([...presetForRole("registrar")]).toEqual([
      ...REGISTRAR_PRESET,
    ]);
  });

  it("vehicleVerifier preset disables enrollment + sensitive surfaces", () => {
    expect([...VEHICLE_VERIFIER_PRESET]).toEqual([
      "enrollmentCapture",
      "devicePairing",
      "settings",
    ]);
    expect([...presetForRole("vehicleVerifier")]).toEqual([
      ...VEHICLE_VERIFIER_PRESET,
    ]);
  });

  it("CLEAR_ALL_PRESET is empty", () => {
    expect([...CLEAR_ALL_PRESET]).toEqual([]);
  });
});

describe("buildEditorDraft", () => {
  it("returns empty draft when policy is undefined (pending device)", () => {
    expect(buildEditorDraft(undefined)).toEqual({
      disabledCapabilities: [],
      policyReason: "",
    });
  });

  it("clones policy fields into the draft", () => {
    const draft = buildEditorDraft({
      policyVersion: 3,
      disabledCapabilities: ["diagnostics"],
      policyReason: "pilot",
    });
    expect(draft.disabledCapabilities).toEqual(["diagnostics"]);
    expect(draft.policyReason).toBe("pilot");
  });

  it("returned arrays do not alias source policy", () => {
    const policy = {
      policyVersion: 1,
      disabledCapabilities: ["diagnostics"] as const,
    };
    const draft = buildEditorDraft({
      ...policy,
      disabledCapabilities: [...policy.disabledCapabilities],
    });
    (draft.disabledCapabilities as string[]).push("settings");
    expect(policy.disabledCapabilities).toEqual(["diagnostics"]);
  });
});

describe("toggleCapability", () => {
  it("adds a capability when absent", () => {
    const draft = { disabledCapabilities: [] as string[], policyReason: "" };
    const next = toggleCapability(
      { ...draft, disabledCapabilities: [] },
      "diagnostics",
    );
    expect(next.disabledCapabilities).toEqual(["diagnostics"]);
  });

  it("removes a capability when present", () => {
    const next = toggleCapability(
      { disabledCapabilities: ["diagnostics"], policyReason: "" },
      "diagnostics",
    );
    expect(next.disabledCapabilities).toEqual([]);
  });

  it("preserves canonical order after toggle", () => {
    const next = toggleCapability(
      { disabledCapabilities: ["settings"], policyReason: "" },
      "enrollmentCapture",
    );
    expect(next.disabledCapabilities).toEqual([
      "enrollmentCapture",
      "settings",
    ]);
  });

  it("preserves policyReason across toggle", () => {
    expect(
      toggleCapability(
        { disabledCapabilities: [], policyReason: "pilot note" },
        "diagnostics",
      ).policyReason,
    ).toBe("pilot note");
  });
});

describe("applyPreset", () => {
  it("replaces the disabled set with the preset content", () => {
    const next = applyPreset(
      { disabledCapabilities: ["diagnostics"], policyReason: "x" },
      REGISTRAR_PRESET,
    );
    expect(next.disabledCapabilities).toEqual([...REGISTRAR_PRESET]);
  });

  it("preserves policyReason across preset switch", () => {
    expect(
      applyPreset(
        { disabledCapabilities: [], policyReason: "audit" },
        VEHICLE_VERIFIER_PRESET,
      ).policyReason,
    ).toBe("audit");
  });
});

describe("requiresConfirm", () => {
  it("returns false when nothing changes", () => {
    expect(requiresConfirm([], [])).toBe(false);
    expect(requiresConfirm(["diagnostics"], ["diagnostics"])).toBe(false);
  });

  it("returns false when ONLY diagnostics (non-critical) is newly disabled", () => {
    expect(requiresConfirm([], ["diagnostics"])).toBe(false);
  });

  it("returns true when a critical capability is newly disabled", () => {
    expect(requiresConfirm([], ["settings"])).toBe(true);
    expect(requiresConfirm([], ["enrollmentCapture"])).toBe(true);
    expect(requiresConfirm([], ["verificationCapture"])).toBe(true);
    expect(requiresConfirm([], ["passiveFaceCheck"])).toBe(true);
    expect(requiresConfirm([], ["devicePairing"])).toBe(true);
  });

  it("does NOT trigger confirm when re-enabling a critical capability", () => {
    expect(requiresConfirm(["settings"], [])).toBe(false);
  });

  it("triggers confirm for disable-all (all 6 canonical capabilities)", () => {
    expect(
      requiresConfirm([], [
        "enrollmentCapture",
        "verificationCapture",
        "passiveFaceCheck",
        "devicePairing",
        "diagnostics",
        "settings",
      ]),
    ).toBe(true);
  });

  it("triggers confirm for near-full lock (5+ including all criticals)", () => {
    expect(
      requiresConfirm([], [
        "enrollmentCapture",
        "verificationCapture",
        "passiveFaceCheck",
        "devicePairing",
        "settings",
      ]),
    ).toBe(true);
  });
});

describe("applyPolicyEdit", () => {
  it("bumps policyVersion from prev + 1", () => {
    const next = applyPolicyEdit(
      {
        policyVersion: 4,
        disabledCapabilities: ["diagnostics"],
      },
      { disabledCapabilities: ["diagnostics", "settings"], policyReason: "x" },
      NOW,
    );
    expect(next.policyVersion).toBe(5);
  });

  it("starts at version 1 when no previous policy", () => {
    expect(
      applyPolicyEdit(
        undefined,
        { disabledCapabilities: [], policyReason: "" },
        NOW,
      ).policyVersion,
    ).toBe(1);
  });

  it("uses the supplied 'now' as updatedAt (no Date.now() calls)", () => {
    expect(
      applyPolicyEdit(
        undefined,
        { disabledCapabilities: [], policyReason: "" },
        NOW,
      ).updatedAt,
    ).toBe(NOW);
  });

  it("trims policyReason and omits when empty", () => {
    const withReason = applyPolicyEdit(
      undefined,
      { disabledCapabilities: [], policyReason: "   pilot rollout  " },
      NOW,
    );
    expect(withReason.policyReason).toBe("pilot rollout");

    const noReason = applyPolicyEdit(
      undefined,
      { disabledCapabilities: [], policyReason: "    " },
      NOW,
    );
    expect("policyReason" in noReason).toBe(false);
  });

  it("returned policy's disabledCapabilities is not aliased to the draft", () => {
    const draft = {
      disabledCapabilities: ["diagnostics"],
      policyReason: "",
    };
    const next = applyPolicyEdit(undefined, draft, NOW);
    (draft.disabledCapabilities as string[]).push("settings");
    expect(next.disabledCapabilities).toEqual(["diagnostics"]);
  });
});
