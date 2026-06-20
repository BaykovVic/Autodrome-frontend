import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { selectFixtures } from "@/api/mock/fixtures";
import { ExercisePublishForm } from "@/app/(shell)/exercises/_components/ExercisePublishForm";
import type { Exercise } from "@/app/(shell)/exercises/_components/useExercisesData";

const PUBLISHED: Exercise = {
  exerciseId: "40000000-0000-4000-8000-000000000011",
  code: "EX-PUB",
  title: "Published exercise",
  status: "published",
  createdAt: "2026-06-19T10:00:00Z",
  currentVersion: {
    versionId: "40000001-0000-4000-8000-000000000099",
    versionNumber: 1,
  },
};

describe("ExercisePublishForm", () => {
  it("publishes a draft and reports new published status", async () => {
    const api = createMockAdapter("normal");
    // Pick a real draft from fixtures so the mock publish handler can
    // resolve it and answer with a full contract-shaped Exercise.
    const draft = selectFixtures("normal").exercises.find(
      (e) => e.status === "draft",
    )!;
    const onPublished = vi.fn();
    render(
      <ExercisePublishForm
        api={api}
        exercise={draft}
        onPublished={onPublished}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^publish…$/i }));
    fireEvent.change(
      screen.getByRole("textbox", { name: /notes/i }),
      { target: { value: "first publish" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /^submit publish$/i }),
    );

    await waitFor(() => expect(onPublished).toHaveBeenCalled());
    const next = onPublished.mock.calls[0][0] as Exercise;
    expect(next.status).toBe("published");
    expect(next.currentVersion?.versionId).toBeTruthy();
    // Codex review (R1): publish response must keep contract-required
    // identity fields (code, title, createdAt) so the workspace
    // patchExercise cannot lose them.
    expect(next.code).toBe(draft.code);
    expect(next.title).toBe(draft.title);
    expect(next.createdAt).toBe(draft.createdAt);
  });

  it("locks the action when exercise is already published", () => {
    const api = createMockAdapter("normal");
    render(
      <ExercisePublishForm
        api={api}
        exercise={PUBLISHED}
        onPublished={() => undefined}
      />,
    );
    expect(screen.getByText(/already published/i)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: /^publish…$/i }),
    ).toBeNull();
  });
});
