import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { ApiError } from "@/api/errors";
import { recordingsFor } from "@/api/mock/fixtures";
import type { MockScenario } from "@/api/mock/scenarios";
import { EvidenceWorkspace } from "@/app/(shell)/evidence/_components/EvidenceWorkspace";

function scenarioLoader(scenario: MockScenario) {
  return () => recordingsFor(scenario);
}

async function renderWith(loader: () => unknown) {
  render(<EvidenceWorkspace loader={loader as never} />);
  if (
    screen.queryByRole("status", { name: /loading recordings/i })
  ) {
    await waitForElementToBeRemoved(
      () =>
        screen.queryByRole("status", { name: /loading recordings/i }),
      { timeout: 2000 },
    );
  }
}

describe("EvidenceWorkspace", () => {
  it("renders recordings for the normal scenario", async () => {
    await renderWith(scenarioLoader("normal"));
    expect(
      screen.getByRole("heading", { level: 1, name: /^evidence$/i }),
    ).toBeDefined();
    expect(await screen.findByText(/Showing 2 of 2/i)).toBeDefined();
    const idButtons = await screen.findAllByRole("button", {
      name: /70000000…/,
    });
    expect(idButtons.length).toBeGreaterThan(0);
  });

  it("filters by status", async () => {
    await renderWith(scenarioLoader("violations-detected"));
    await screen.findByText(/Showing 4 of 4/i);
    const statusSelect = screen.getByRole("combobox", {
      name: /^status$/i,
    }) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "active" } });
    expect(screen.getByText(/Showing 1 of 4/i)).toBeDefined();
  });

  it("filters by modality (audio)", async () => {
    await renderWith(scenarioLoader("violations-detected"));
    await screen.findByText(/Showing 4 of 4/i);
    const modalitySelect = screen.getByRole("combobox", {
      name: /^modality$/i,
    }) as HTMLSelectElement;
    fireEvent.change(modalitySelect, { target: { value: "audio" } });
    // Two of four fixture recordings include a microphone source.
    expect(screen.getByText(/Showing 2 of 4/i)).toBeDefined();
  });

  it("opens detail panel with linked exam and source labels", async () => {
    await renderWith(scenarioLoader("normal"));
    const idButtons = await screen.findAllByRole("button", {
      name: /70000000…/,
    });
    fireEvent.click(idButtons[0]);

    expect(
      screen.getByRole("complementary", {
        name: /Recording 70000000-/i,
      }),
    ).toBeDefined();
    expect(screen.getByText(/Linked exam/i)).toBeDefined();
    expect(
      screen.getByText(/Cabin — front camera/i),
    ).toBeDefined();
    expect(
      screen.getByText(/Open the dedicated viewer for playback/i),
    ).toBeDefined();
    // Biometry and telemetry are surfaced as linked evidence types.
    expect(screen.getByText(/biometry · linked/i)).toBeDefined();
    expect(screen.getByText(/telemetry · linked/i)).toBeDefined();
  });

  it("renders empty state for empty scenario", async () => {
    await renderWith(scenarioLoader("empty"));
    expect(
      await screen.findByText(/No recordings in this scenario/i),
    ).toBeDefined();
  });

  it("surfaces DegradedState when loader throws an ApiError 503", async () => {
    const degradedLoader = () => {
      throw new ApiError({
        status: 503,
        code: "SERVICE_DEGRADED",
        message: "media-archive-service is degraded",
        url: "/api/media-archive/v1/media/recordings",
      });
    };
    await renderWith(degradedLoader);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(
      screen.getByText(/media-archive-service · recordings/i),
    ).toBeDefined();
  });

  it("surfaces ApiErrorView when loader throws a non-degraded error", async () => {
    const failingLoader = () => {
      throw new ApiError({
        status: 400,
        code: "BAD_REQUEST",
        message: "loader failed",
        url: "/api/media-archive/v1/media/recordings",
      });
    };
    await renderWith(failingLoader);
    expect(screen.getByText(/BAD_REQUEST/i)).toBeDefined();
  });
});
