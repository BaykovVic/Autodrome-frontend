import { describe, expect, it } from "vitest";

import {
  ANDROID_BINDING_LABELS,
  BINDING_TYPES_FOR_ROLE,
  buildAssignmentBody,
  buildRetireBody,
  emptyAssignmentDraft,
  emptyRetireDraft,
  validateAssignmentDraft,
} from "@/app/(shell)/devices/_components/androidAssignmentHelpers";

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

  it("returns empty list when role + compatible binding + anchor are present", () => {
    expect(
      validateAssignmentDraft({
        role: "registrar",
        bindingType: "receptionPoint",
        anchorId: "RPT-A",
        notes: "",
      }),
    ).toEqual([]);
  });

  it("flags binding incompatibility: registrar + vehicle", () => {
    const issues = validateAssignmentDraft({
      role: "registrar",
      bindingType: "vehicle",
      anchorId: "VEH-1",
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
      anchorId: "RPT-A",
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
      anchorId: "WS-1",
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
  });

  it("does not flag binding_incompatible when role is missing", () => {
    const issues = validateAssignmentDraft({
      role: null,
      bindingType: "vehicle",
      anchorId: "VEH-1",
      notes: "",
    });
    expect(
      issues.find((i) => i.code === "binding_incompatible"),
    ).toBeUndefined();
  });
});

describe("buildAssignmentBody", () => {
  it("builds canonical AndroidDeviceAssignment for valid draft", () => {
    const body = buildAssignmentBody({
      role: "registrar",
      bindingType: "receptionPoint",
      anchorId: "RPT-A",
      notes: "Pilot rollout",
    });
    expect(body).toEqual({
      role: "registrar",
      binding: { type: "receptionPoint", anchorId: "RPT-A" },
      notes: "Pilot rollout",
    });
  });

  it("trims anchorId and notes", () => {
    const body = buildAssignmentBody({
      role: "vehicleVerifier",
      bindingType: "vehicle",
      anchorId: "  VEH-1  ",
      notes: "  audit  ",
    });
    expect(body.binding.anchorId).toBe("VEH-1");
    expect(body.notes).toBe("audit");
  });

  it("omits notes when empty after trim", () => {
    const body = buildAssignmentBody({
      role: "registrar",
      bindingType: "workstation",
      anchorId: "WS-1",
      notes: "    ",
    });
    expect("notes" in body).toBe(false);
  });

  it("omits policy from the body (assign-only — policy editor changes policy separately)", () => {
    const body = buildAssignmentBody({
      role: "registrar",
      bindingType: "receptionPoint",
      anchorId: "RPT-A",
      notes: "",
    });
    expect("policy" in body).toBe(false);
  });

  it("throws when draft is invalid (defensive — caller MUST validate first)", () => {
    expect(() =>
      buildAssignmentBody({
        role: null,
        bindingType: "receptionPoint",
        anchorId: "RPT-A",
        notes: "",
      }),
    ).toThrow(/role.*binding required/i);
    expect(() =>
      buildAssignmentBody({
        role: "registrar",
        bindingType: null,
        anchorId: "RPT-A",
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
