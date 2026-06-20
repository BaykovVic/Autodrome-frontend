import { describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { RuleDraftCreateForm } from "@/app/(shell)/rules/_components/RuleDraftCreateForm";
import type { RuleDefinition } from "@/app/(shell)/rules/_components/useRulesData";

function renderForm(onSuccess?: (r: RuleDefinition) => void) {
  const api = createMockAdapter("normal");
  render(
    <RuleDraftCreateForm
      api={api}
      open
      onClose={() => undefined}
      onSuccess={onSuccess}
    />,
  );
}

describe("RuleDraftCreateForm", () => {
  it("validates violation id and title before submit", () => {
    renderForm();
    fireEvent.click(
      screen.getByRole("button", { name: /^create draft$/i }),
    );
    expect(
      screen.getByText(/Violation id must be a UUID/i),
    ).toBeDefined();
    expect(screen.getByText(/Title is required/i)).toBeDefined();
  });

  it("submits RuleDraft and returns full contract-shaped RuleDefinition", async () => {
    const onSuccess = vi.fn();
    renderForm(onSuccess);

    fireEvent.change(
      screen.getByRole("textbox", { name: /violation id/i }),
      {
        target: {
          value: "50000000-0000-4000-8000-000000000009",
        },
      },
    );
    fireEvent.change(screen.getByRole("textbox", { name: /^title$/i }), {
      target: { value: "Custom rule — created from form" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /^create draft$/i }),
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const created = onSuccess.mock.calls[0][0] as RuleDefinition;
    // Codex R1 lesson (full contract shape): mock POST /rules must
    // return required RuleDefinition fields so workspace insert keeps
    // identity intact.
    expect(created.ruleId).toBeTruthy();
    expect(created.status).toBe("draft");
    expect(created.ruleVersion).toBe(1);
    expect(created.violationRef.violationId).toBe(
      "50000000-0000-4000-8000-000000000009",
    );
    expect(created.title).toBe("Custom rule — created from form");
    expect(created.createdAt).toBeTruthy();
  });

  it("rejects non-UUID violation id input", async () => {
    const onSuccess = vi.fn();
    renderForm(onSuccess);
    fireEvent.change(
      screen.getByRole("textbox", { name: /violation id/i }),
      { target: { value: "not-a-uuid" } },
    );
    fireEvent.change(screen.getByRole("textbox", { name: /^title$/i }), {
      target: { value: "Whatever" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^create draft$/i }),
    );
    expect(
      screen.getByText(/Violation id must be a UUID/i),
    ).toBeDefined();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
