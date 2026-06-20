import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { selectFixtures } from "@/api/mock/fixtures";
import { RuleDetail } from "@/app/(shell)/rules/_components/RuleDetail";
import { RuleEditorForm } from "@/app/(shell)/rules/_components/RuleEditorForm";
import type { RuleDefinition } from "@/app/(shell)/rules/_components/useRulesData";

const PUBLISHED: RuleDefinition = {
  ruleId: "60000000-0000-4000-8000-000000000099",
  violationRef: {
    violationId: "50000000-0000-4000-8000-000000000099",
  },
  title: "Already published rule",
  ruleVersion: 2,
  status: "published",
  createdAt: "2026-06-19T10:00:00Z",
};

function pickDraft(): RuleDefinition {
  const draft = selectFixtures("violations-detected").rules.find(
    (r) => r.status === "draft",
  );
  if (!draft) throw new Error("expected a draft rule in fixtures");
  return draft;
}

describe("RuleEditorForm", () => {
  it("renders default JSON for conditions/inputs/actions and shows a payload preview", () => {
    const api = createMockAdapter("violations-detected");
    render(
      <RuleEditorForm
        api={api}
        rule={pickDraft()}
        onPublished={() => undefined}
      />,
    );

    const conditions = screen.getByRole("textbox", {
      name: /conditions/i,
    }) as HTMLTextAreaElement;
    expect(conditions.value).toBe("{}");

    const inputs = screen.getByRole("textbox", {
      name: /^inputs/i,
    }) as HTMLTextAreaElement;
    expect(inputs.value).toBe("[]");

    const actions = screen.getByRole("textbox", {
      name: /^actions/i,
    }) as HTMLTextAreaElement;
    expect(actions.value).toBe("[]");

    const preview = screen.getByLabelText(/payload preview/i);
    expect(preview.textContent).toContain('"conditionTree"');
    expect(preview.textContent).toContain("{}");
  });

  it("flags invalid JSON without crashing and disables publish", () => {
    const api = createMockAdapter("violations-detected");
    render(
      <RuleEditorForm
        api={api}
        rule={pickDraft()}
        onPublished={() => undefined}
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /conditions/i }),
      { target: { value: "{not json" } },
    );

    expect(screen.getByText(/Invalid JSON/i)).toBeDefined();
    const publishBtn = screen.getByRole("button", {
      name: /publish version/i,
    }) as HTMLButtonElement;
    expect(publishBtn.disabled).toBe(true);
    // Preview should switch to the empty hint when validation fails.
    expect(
      screen.getByText(/Fix the highlighted fields/i),
    ).toBeDefined();
  });

  it("rejects a JSON array for conditions and a non-object element in inputs", () => {
    const api = createMockAdapter("violations-detected");
    render(
      <RuleEditorForm
        api={api}
        rule={pickDraft()}
        onPublished={() => undefined}
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /conditions/i }),
      { target: { value: "[]" } },
    );
    expect(
      screen.getByText(/Conditions must be a JSON object/i),
    ).toBeDefined();

    fireEvent.change(
      screen.getByRole("textbox", { name: /conditions/i }),
      { target: { value: "{}" } },
    );

    fireEvent.change(screen.getByRole("textbox", { name: /^inputs/i }), {
      target: { value: '["telemetry"]' },
    });
    expect(
      screen.getByText(/Inputs must be an array of JSON objects/i),
    ).toBeDefined();
  });

  it("publishes the edited payload and preserves identity fields", async () => {
    const api = createMockAdapter("violations-detected");
    const draft = pickDraft();
    const onPublished = vi.fn();

    render(
      <RuleEditorForm
        api={api}
        rule={draft}
        onPublished={onPublished}
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /conditions/i }),
      {
        target: {
          value: JSON.stringify(
            { all: [{ signal: "speed", op: ">", value: 60 }] },
            null,
            2,
          ),
        },
      },
    );
    fireEvent.change(screen.getByRole("textbox", { name: /^inputs/i }), {
      target: {
        value: JSON.stringify(
          [{ kind: "telemetry", channel: "speed" }],
          null,
          2,
        ),
      },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^actions/i }), {
      target: {
        value: JSON.stringify(
          [{ kind: "raise-violation" }],
          null,
          2,
        ),
      },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /notes/i }), {
      target: { value: "first published version" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /publish version/i }),
    );

    await waitFor(() => expect(onPublished).toHaveBeenCalled());
    const next = onPublished.mock.calls[0][0] as RuleDefinition;
    expect(next.status).toBe("published");
    expect(next.ruleVersion).toBe((draft.ruleVersion ?? 0) + 1);
    // Identity fields must survive the publish merge (R1 exercise lesson).
    expect(next.ruleId).toBe(draft.ruleId);
    expect(next.violationRef.violationId).toBe(
      draft.violationRef.violationId,
    );
    expect(next.title).toBe(draft.title);
    expect(next.createdAt).toBe(draft.createdAt);
    // The mock echoes the edited conditionTree/inputs/actions back.
    expect(next.conditionTree).toEqual({
      all: [{ signal: "speed", op: ">", value: 60 }],
    });
    expect(next.inputs).toEqual([{ kind: "telemetry", channel: "speed" }]);
    expect(next.actions).toEqual([{ kind: "raise-violation" }]);
  });

  it("resets editor state when the selected rule changes (no payload leak across rules)", () => {
    const api = createMockAdapter("violations-detected");
    const DRAFT_A: RuleDefinition = {
      ruleId: "70000000-0000-4000-8000-00000000000a",
      violationRef: {
        violationId: "50000000-0000-4000-8000-00000000000a",
      },
      title: "Draft A",
      ruleVersion: 1,
      status: "draft",
      createdAt: "2026-06-19T10:00:00Z",
    };
    const DRAFT_B: RuleDefinition = {
      ruleId: "70000000-0000-4000-8000-00000000000b",
      violationRef: {
        violationId: "50000000-0000-4000-8000-00000000000b",
      },
      title: "Draft B",
      ruleVersion: 1,
      status: "draft",
      conditionTree: { any: [{ signal: "lane", op: "==", value: 1 }] },
      createdAt: "2026-06-19T10:00:00Z",
    };

    const { rerender } = render(
      <RuleDetail
        api={api}
        rule={DRAFT_A}
        onClose={() => undefined}
        onUpdated={() => undefined}
      />,
    );

    const conditionsA = screen.getByRole("textbox", {
      name: /conditions/i,
    }) as HTMLTextAreaElement;
    expect(conditionsA.value).toBe("{}");

    // Operator edits draft A's payload.
    fireEvent.change(conditionsA, {
      target: { value: '{"all":[{"signal":"speed","op":">","value":60}]}' },
    });
    expect(
      (
        screen.getByRole("textbox", {
          name: /conditions/i,
        }) as HTMLTextAreaElement
      ).value,
    ).toContain('"speed"');

    // Operator selects draft B without closing the detail panel.
    rerender(
      <RuleDetail
        api={api}
        rule={DRAFT_B}
        onClose={() => undefined}
        onUpdated={() => undefined}
      />,
    );

    const conditionsB = screen.getByRole("textbox", {
      name: /conditions/i,
    }) as HTMLTextAreaElement;
    // Editor must show draft B's payload, not the edited draft A text.
    expect(conditionsB.value).toContain('"lane"');
    expect(conditionsB.value).not.toContain('"speed"');

    const preview = screen.getByLabelText(/payload preview/i);
    expect(preview.textContent).toContain('"lane"');
    expect(preview.textContent).not.toContain('"speed"');
  });

  it("locks the editor for already-published rules", () => {
    const api = createMockAdapter("normal");
    render(
      <RuleEditorForm
        api={api}
        rule={PUBLISHED}
        onPublished={() => undefined}
      />,
    );
    expect(screen.getByText(/already published/i)).toBeDefined();
    expect(
      screen.queryByRole("textbox", { name: /conditions/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /publish version/i }),
    ).toBeNull();
  });
});
