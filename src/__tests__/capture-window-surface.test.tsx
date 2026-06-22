import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { CaptureWindowSurface } from "@/app/capture/[sessionId]/CaptureWindowSurface";
import { consoleCameraStationFor } from "@/app/(shell)/candidates/_components/consoleCameraStationFixtures";

describe("CaptureWindowSurface", () => {
  it("renders window title bar with ENR id, candidate context and footer privacy copy", () => {
    render(
      <CaptureWindowSurface snapshot={consoleCameraStationFor("capturing")} />,
    );
    expect(
      screen.getByRole("dialog", { name: /capture window/i }),
    ).toBeDefined();
    expect(screen.getByText(/Capture for enrollment/i)).toBeDefined();
    expect(screen.getByText("ENR-9F41")).toBeDefined();
    expect(screen.getByText(/Irina Volkova/i)).toBeDefined();
    expect(screen.getByText(/\*\*\.\*\*\.2002 · CND-2026-0144/)).toBeDefined();
    expect(
      screen.getByText(/Frames are processed on the node/i),
    ).toBeDefined();
  });

  it("renders preview prompts and quality chips", () => {
    render(
      <CaptureWindowSurface snapshot={consoleCameraStationFor("capturing")} />,
    );
    expect(
      screen.getByText(/Look straight into the camera/i),
    ).toBeDefined();
    expect(
      screen.getByText(/Keep your face inside the oval/i),
    ).toBeDefined();
    const chips = screen.getByLabelText(/quality checks/i);
    expect(chips).toBeDefined();
    expect(
      chips.querySelectorAll("span").length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("renders the capture progress bar with the snapshot percent", () => {
    render(
      <CaptureWindowSurface snapshot={consoleCameraStationFor("capturing")} />,
    );
    const bar = screen.getByRole("progressbar", {
      name: /capture progress/i,
    });
    expect(bar.getAttribute("aria-valuenow")).toBe("72");
  });

  it("Done transitions the surface to a finished committed state with the snapshot copy", () => {
    render(
      <CaptureWindowSurface snapshot={consoleCameraStationFor("capturing")} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^done$/i }));
    expect(screen.getByText(/^Capture finished$/i)).toBeDefined();
    expect(
      screen.getByText(/Template sealed on NODE-A2 in the local mock/i),
    ).toBeDefined();
    // Both action buttons disabled after commit.
    const done = screen.getByRole("button", {
      name: /^done$/i,
    }) as HTMLButtonElement;
    const cancel = screen.getByRole("button", {
      name: /^cancel$/i,
    }) as HTMLButtonElement;
    expect(done.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
  });

  it("Cancel transitions the surface to a cancelled committed state", () => {
    render(
      <CaptureWindowSurface snapshot={consoleCameraStationFor("capturing")} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.getByText(/^Capture cancelled$/i)).toBeDefined();
    expect(
      screen.getByText(/Operator cancelled capture/i),
    ).toBeDefined();
  });

  it("done scenario snapshot disables Done/Cancel from the start", () => {
    render(
      <CaptureWindowSurface snapshot={consoleCameraStationFor("done")} />,
    );
    const done = screen.getByRole("button", {
      name: /^done$/i,
    }) as HTMLButtonElement;
    const cancel = screen.getByRole("button", {
      name: /^cancel$/i,
    }) as HTMLButtonElement;
    expect(done.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
    expect(screen.getByText(/^Capture finished$/i)).toBeDefined();
  });

  it("Close button mirrors the Cancel action", () => {
    render(
      <CaptureWindowSurface snapshot={consoleCameraStationFor("capturing")} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /close capture window/i }),
    );
    expect(screen.getByText(/^Capture cancelled$/i)).toBeDefined();
  });
});
