import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/candidates/sessions/ENR-9F41/camera-station",
}));

import { CameraStationScreen } from "@/app/(shell)/candidates/_components/CameraStationScreen";
import {
  consoleCameraStationFor,
  CAMERA_STATION_SCENARIOS,
} from "@/app/(shell)/candidates/_components/consoleCameraStationFixtures";
import type { CameraStationScenario } from "@/app/(shell)/candidates/_components/consoleCameraStation";

function renderStation(scenario: CameraStationScenario) {
  render(
    <CameraStationScreen
      loader={() => consoleCameraStationFor(scenario)}
    />,
  );
}

describe("CameraStationScreen", () => {
  it("renders breadcrumb, title, subtitle and device/window/quality blocks for capturing", async () => {
    renderStation("capturing");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /camera station — operator pc/i,
      }),
    ).toBeDefined();
    expect(
      screen.getByText(/Capture runs in a separate window/i),
    ).toBeDefined();
    expect(
      screen.getByText(/Logitech BRIO — station camera/i),
    ).toBeDefined();
    expect(
      screen.getByText(/Capture window open on the second monitor/i),
    ).toBeDefined();
    const quality = screen.getByLabelText(/capture quality progress/i);
    expect(within(quality).getByText(/Lighting/i)).toBeDefined();
    expect(within(quality).getByText(/Sharpness/i)).toBeDefined();
    expect(within(quality).getByText(/Face position/i)).toBeDefined();
    expect(within(quality).getByText(/Stability/i)).toBeDefined();
  });

  it("Open capture window is a real anchor with target=\"_blank\" to /capture/[id]", async () => {
    renderStation("capturing");
    await screen.findByText(/Logitech BRIO/);
    const open = screen.getByRole("link", {
      name: /open capture window in a new browser window/i,
    });
    expect(open.getAttribute("href")).toBe("/capture/ENR-9F41");
    expect(open.getAttribute("target")).toBe("_blank");
    expect(open.getAttribute("rel") ?? "").toMatch(/noopener/);
  });

  it("Retry on capturing transitions to ready committed-state with reset quality", async () => {
    renderStation("capturing");
    await screen.findByText(/Logitech BRIO/);
    fireEvent.click(screen.getByRole("button", { name: /^retry$/i }));
    expect(
      screen.getByText(/Capture retry queued/i),
    ).toBeDefined();
    // Quality bars are reset to 0%.
    const quality = screen.getByLabelText(/capture quality progress/i);
    expect(within(quality).getAllByText(/^0%$/).length).toBeGreaterThan(0);
  });

  it("Cancel on capturing transitions to cancelled committed-state", async () => {
    renderStation("capturing");
    await screen.findByText(/Logitech BRIO/);
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.getByText(/^Capture cancelled$/i)).toBeDefined();
    // "Operator cancelled capture..." appears in both the committed
    // banner and the window status row.
    expect(
      screen.getAllByText(/Operator cancelled capture from the station/i)
        .length,
    ).toBeGreaterThan(0);
  });

  it("permission-denied disables Open capture window with visible reason", async () => {
    renderStation("permission-denied");
    await screen.findByText(/Logitech BRIO/);
    const openBtn = screen.getByRole("button", {
      name: /open capture window/i,
    }) as HTMLButtonElement;
    expect(openBtn.disabled).toBe(true);
    expect(openBtn.getAttribute("title") ?? "").toMatch(
      /Browser permission was denied/i,
    );
    expect(
      screen.getByRole("note", {
        // matches actionsNote
      }),
    ).toBeDefined();
  });

  it("done scenario disables Retry and Cancel with visible reason", async () => {
    renderStation("done");
    await screen.findByText(/Logitech BRIO/);
    const retry = screen.getByRole("button", {
      name: /^retry$/i,
    }) as HTMLButtonElement;
    const cancel = screen.getByRole("button", {
      name: /^cancel$/i,
    }) as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
    expect(
      screen.getByText(/Capture finished — template sealed on NODE-A2/i),
    ).toBeDefined();
  });

  it("cancelled scenario disables Retry/Cancel and shows cancelled window status", async () => {
    renderStation("cancelled");
    await screen.findByText(/Logitech BRIO/);
    const retry = screen.getByRole("button", {
      name: /^retry$/i,
    }) as HTMLButtonElement;
    const cancel = screen.getByRole("button", {
      name: /^cancel$/i,
    }) as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
    expect(
      screen.getByText(/Operator cancelled capture from the station/i),
    ).toBeDefined();
  });

  it("renders Skeleton while loader is pending (R1)", () => {
    const pending = new Promise<never>(() => {});
    render(
      <CameraStationScreen
        loader={() =>
          pending as unknown as ReturnType<typeof consoleCameraStationFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading camera station/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects (R1)", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "LOADER_FAIL",
      status: 500,
    });
    render(<CameraStationScreen loader={() => Promise.reject(error)} />);
    expect(await screen.findByText(/loader failed/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });

  it("covers all 5 camera station scenarios with distinct snapshots", () => {
    expect(CAMERA_STATION_SCENARIOS.length).toBe(5);
    const scenarios = new Set<CameraStationScenario>();
    for (const s of CAMERA_STATION_SCENARIOS) {
      const snapshot = consoleCameraStationFor(s);
      expect(snapshot.scenario).toBe(s);
      scenarios.add(snapshot.scenario);
    }
    expect(scenarios.size).toBe(5);
  });
});
