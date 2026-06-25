import { describe, expect, it } from "vitest";

import {
  ANDROID_BINDING_LABELS,
  BINDING_TYPES_FOR_ROLE,
  buildAssignmentBody,
  buildRetireBody,
  emptyAssignmentDraft,
  emptyRetireDraft,
  isUuid,
  validateAssignmentDraft,
} from "@/app/(shell)/devices/_components/androidAssignmentHelpers";

// Canonical UUID v4 examples used as valid anchor inputs in the
// success cases. Mirrors what the live backend would accept per
// the canonical `AndroidDeviceBinding.anchorId` (format: uuid)
// declaration in the android-device-management OpenAPI spec.
const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_2 = "22222222-2222-4222-8222-222222222222";

describe("BINDING_TYPES_FOR_ROLE (canonical compatibility map)", () => {
  it("registrar accepts receptionPoint + workstation only", () => {
    expect([...BINDING_TYPES_FOR_ROLE.registrar]).toEqual([
      "receptionPoint",
      "workstation",
    ]);
  });

  it("vehicleVerifier accepts vehicle only", () => {
    expect([...BINDING_TYPES_FOR_ROLE.vehicleVerifier]).toEqual(["vehicle"]);
  });
});

describe("ANDROID_BINDING_LABELS", () => {
  it("provides operator-friendly labels for all canonical binding types", () => {
    expect(ANDROID_BINDING_LABELS.receptionPoint).toBe("Reception point");
    expect(ANDROID_BINDING_LABELS.workstation).toBe("Workstation");
    expect(ANDROID_BINDING_LABELS.vehicle).toBe("Vehicle");
  });
});

describe("validateAssignmentDraft", () => {
  it("returns role_missing + binding_missing + anchor_missing for empty draft", () => {
    const issues = validateAssignmentDraft(emptyAssignmentDraft());
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("role_missing");
    expect(codes).toContain("binding_missing");
    expect(codes).toContain("anchor_missing");
  });

  it("returns empty list when role + compatible binding + canonical UUID anchor are present", () => {
    expect(
      validateAssignmentDraft({
        role: "registrar",
        bindingType: "receptionPoint",
        anchorId: VALID_UUID,
        notes: "",
      }),
    ).toEqual([]);
  });

  it("flags binding incompatibility: registrar + vehicle", () => {
    const issues = validateAssignmentDraft({
      role: "registrar",
      bindingType: "vehicle",
      anchorId: VALID_UUID,
      notes: "",
    });
    const incompat = issues.find(
      (i) => i.code === "binding_incompatible",
    );
    expect(incompat).toBeDefined();
    expect(
      incompat?.code === "binding_incompatible" && incompat.role,
    ).toBe("registrar");
  });

  it("flags binding incompatibility: vehicleVerifier + receptionPoint", () => {
    const issues = validateAssignmentDraft({
      role: "vehicleVerifier",
      bindingType: "receptionPoint",
      anchorId: VALID_UUID,
      notes: "",
    });
    const incompat = issues.find(
      (i) => i.code === "binding_incompatible",
    );
    expect(incompat).toBeDefined();
    expect(
      incompat?.code === "binding_incompatible" && incompat.role,
    ).toBe("vehicleVerifier");
  });

  it("flags binding incompatibility: vehicleVerifier + workstation", () => {
    const issues = validateAssignmentDraft({
      role: "vehicleVerifier",
      bindingType: "workstation",
      anchorId: VALID_UUID,
      notes: "",
    });
    const incompat = issues.find(
      (i) => i.code === "binding_incompatible",
    );
    expect(incompat).toBeDefined();
  });

  it("flags anchor_missing for whitespace-only anchor", () => {
    const issues = validateAssignmentDraft({
      role: "registrar",
      bindingType: "receptionPoint",
      anchorId: "    ",
      notes: "",
    });
    expect(issues.find((i) => i.code === "anchor_missing")).toBeDefined();
    // anchor_missing alone — should not also flag invalid UUID for
    // an empty input.
    expect(
      issues.find((i) => i.code === "anchor_invalid_uuid"),
    ).toBeUndefined();
  });

  it("flags anchor_invalid_uuid for operator-friendly labels (R1 contract guard)", () => {
    // Operator-friendly labels like `WS-PILOT-1` / `RPT-A` /
    // `VEH-100` were accepted in iter 1 — closing that mock/live
    // split (canonical `AndroidDeviceBinding.anchorId` is
    // `format: uuid`).
    for (const fakeAnchor of [
      "WS-PILOT-1",
      "RPT-A",
      "VEH-100",
      "not-a-uuid",
      "00000000-0000-0000-0000",
      "11111111-1111-4111-8111-1111111111111",
    ]) {
      const issues = validateAssignmentDraft({
        role: "registrar",
        bindingType: "receptionPoint",
        anchorId: fakeAnchor,
        notes: "",
      });
      const invalid = issues.find(
        (i) => i.code === "anchor_invalid_uuid",
      );
      expect(invalid, `should reject "${fakeAnchor}"`).toBeDefined();
    }
  });

  it("accepts canonical UUID variants v1-v5 including upper-case input", () => {
    for (const validAnchor of [
      "11111111-1111-1111-8111-111111111111", // v1
      "11111111-1111-4111-8111-111111111111", // v4 lower
      "11111111-1111-5111-9111-111111111111", // v5 + variant 9
      "11111111-1111-4111-A111-111111111111".toUpperCase(),
    ]) {
      expect(
        validateAssignmentDraft({
          role: "registrar",
          bindingType: "workstation",
          anchorId: validAnchor,
          notes: "",
        }),
      ).toEqual([]);
    }
  });

  it("does not flag binding_incompatible when role is missing", () => {
    const issues = validateAssignmentDraft({
      role: null,
      bindingType: "vehicle",
      anchorId: VALID_UUID,
      notes: "",
    });
    expect(
      issues.find((i) => i.code === "binding_incompatible"),
    ).toBeUndefined();
  });
});

describe("isUuid (canonical UUID format guard)", () => {
  it("accepts canonical UUID v1-v5", () => {
    expect(isUuid("11111111-1111-1111-8111-111111111111")).toBe(true);
    expect(isUuid("22222222-2222-4222-9222-222222222222")).toBe(true);
    expect(isUuid("33333333-3333-5333-a333-333333333333")).toBe(true);
  });

  it("tolerates surrounding whitespace (trimmed before match)", () => {
    expect(isUuid("  11111111-1111-4111-8111-111111111111  ")).toBe(true);
  });

  it("tolerates upper-case hex digits", () => {
    expect(isUuid("AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE")).toBe(true);
  });

  it("rejects operator-friendly labels (WS-PILOT-1, RPT-A, VEH-100)", () => {
    expect(isUuid("WS-PILOT-1")).toBe(false);
    expect(isUuid("RPT-A")).toBe(false);
    expect(isUuid("VEH-100")).toBe(false);
  });

  it("rejects malformed UUIDs (wrong length / wrong version / wrong variant)", () => {
    expect(isUuid("11111111-1111-1111-1111-111111111111")).toBe(false); // version 1 nibble = 1, but variant 1 (not 8-b)
    expect(isUuid("11111111-1111-4111-7111-111111111111")).toBe(false); // variant nibble 7
    expect(isUuid("11111111-1111-6111-8111-111111111111")).toBe(false); // version 6
    expect(isUuid("11111111-1111-4111-8111-11111111111")).toBe(false); // short
  });
});

describe("buildAssignmentBody", () => {
  it("builds canonical AndroidDeviceAssignment for valid draft", () => {
    const body = buildAssignmentBody({
      role: "registrar",
      bindingType: "receptionPoint",
      anchorId: VALID_UUID,
      notes: "Pilot rollout",
    });
    expect(body).toEqual({
      role: "registrar",
      binding: { type: "receptionPoint", anchorId: VALID_UUID },
      notes: "Pilot rollout",
    });
  });

  it("trims anchorId and notes (UUID input preserved)", () => {
    const body = buildAssignmentBody({
      role: "vehicleVerifier",
      bindingType: "vehicle",
      anchorId: `  ${VALID_UUID_2}  `,
      notes: "  audit  ",
    });
    expect(body.binding.anchorId).toBe(VALID_UUID_2);
    expect(body.notes).toBe("audit");
  });

  it("omits notes when empty after trim", () => {
    const body = buildAssignmentBody({
      role: "registrar",
      bindingType: "workstation",
      anchorId: VALID_UUID,
      notes: "    ",
    });
    expect("notes" in body).toBe(false);
  });

  it("omits policy from the body (assign-only — policy editor changes policy separately)", () => {
    const body = buildAssignmentBody({
      role: "registrar",
      bindingType: "receptionPoint",
      anchorId: VALID_UUID,
      notes: "",
    });
    expect("policy" in body).toBe(false);
  });

  it("throws when draft is invalid (defensive — caller MUST validate first)", () => {
    expect(() =>
      buildAssignmentBody({
        role: null,
        bindingType: "receptionPoint",
        anchorId: VALID_UUID,
        notes: "",
      }),
    ).toThrow(/role.*binding required/i);
    expect(() =>
      buildAssignmentBody({
        role: "registrar",
        bindingType: null,
        anchorId: VALID_UUID,
        notes: "",
      }),
    ).toThrow(/role.*binding required/i);
  });
});

describe("buildRetireBody", () => {
  it("returns empty object for empty draft (canonical absent semantics)", () => {
    expect(buildRetireBody(emptyRetireDraft())).toEqual({});
  });

  it("trims reason and omits when whitespace-only", () => {
    expect(buildRetireBody({ reason: "   " })).toEqual({});
  });

  it("includes trimmed reason when non-empty", () => {
    expect(buildRetireBody({ reason: "  pilot rotation  " })).toEqual({
      reason: "pilot rotation",
    });
  });
});
