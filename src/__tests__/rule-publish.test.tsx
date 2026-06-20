import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { selectFixtures } from "@/api/mock/fixtures";
import { RulePublishForm } from "@/app/(shell)/rules/_components/RulePublishForm";
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

describe("RulePublishForm", () => {
  it("publishes a draft and reports new status with bumped ruleVersion", async () => {
    const api = createMockAdapter("violations-detected");
    // Pick a real draft from fixtures so the mock publish handler can
    // resolve it and emit a full contract-shaped RuleDefinition.
    const draft = selectFixtures("violations-detected").rules.find(
      (r) => r.status === "draft",
    )!;
    const onPublished = vi.fn();
    render(
      <RulePublishForm
        api={api}
        rule={draft}
        onPublished={onPublished}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^publish…$/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /notes/i }), {
      target: { value: "first publish" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^submit publish$/i }),
    );

    await waitFor(() => expect(onPublished).toHaveBeenCalled());
    const next = onPublished.mock.calls[0][0] as RuleDefinition;
    expect(next.status).toBe("published");
    expect(next.ruleVersion).toBe((draft.ruleVersion ?? 0) + 1);
    // Codex R1 lesson: identity preservation. Publish response must
    // keep contract-required identity (ruleId, violationRef.violationId,
    // createdAt) and the optional title we set on the draft.
    expect(next.ruleId).toBe(draft.ruleId);
    expect(next.violationRef.violationId).toBe(
      draft.violationRef.violationId,
    );
    expect(next.title).toBe(draft.title);
    expect(next.createdAt).toBe(draft.createdAt);
  });

  it("locks the action when rule is already published", () => {
    const api = createMockAdapter("normal");
    render(
      <RulePublishForm
        api={api}
        rule={PUBLISHED}
        onPublished={() => undefined}
      />,
    );
    expect(screen.getByText(/already published/i)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: /^publish…$/i }),
    ).toBeNull();
  });
});
