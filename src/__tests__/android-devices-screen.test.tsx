import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/devices",
}));

import { AndroidDevicesScreen } from "@/app/(shell)/devices/_components/AndroidDevicesScreen";
import { consoleAndroidDevicesFor } from "@/app/(shell)/devices/_components/consoleAndroidDevicesFixtures";

describe("AndroidDevicesScreen", () => {
  it("renders the workspace heading + status filter tabs", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("normal")} />);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /android devices/i,
      }),
    ).toBeDefined();
    expect(screen.getByRole("tab", { name: /^all$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^pending$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^active$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^retired$/i })).toBeDefined();
  });

  it("renders one row per device and selects the first device by default", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("normal")} />);
    expect(
      await screen.findByRole("button", { name: /AD-7F02-PEND/ }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /AD-3A11-REG/ }),
    ).toBeDefined();
    // Detail aside aria-label uses the first device id by default.
    expect(
      screen.getByRole("complementary", { name: /Device AD-7F02-PEND/i }),
    ).toBeDefined();
  });

  it("Pending filter narrows the visible list and updates selection", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("normal")} />);
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    fireEvent.click(screen.getByRole("tab", { name: /^pending$/i }));
    // Pending device is still visible; active devices are filtered out.
    expect(
      screen.queryByRole("button", { name: /AD-3A11-REG/ }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /AD-7F02-PEND/ }),
    ).toBeDefined();
  });

  it("Active filter shows active devices and selection moves to first active row", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("normal")} />);
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    fireEvent.click(screen.getByRole("tab", { name: /^active$/i }));
    expect(
      screen.queryByRole("button", { name: /AD-7F02-PEND/ }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /AD-3A11-REG/ }),
    ).toBeDefined();
    expect(
      screen.getByRole("complementary", { name: /Device AD-3A11-REG/i }),
    ).toBeDefined();
  });

  it("clicking a device row switches the detail aside", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("normal")} />);
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    fireEvent.click(screen.getByRole("button", { name: /AD-9D14-VV/ }));
    expect(
      screen.getByRole("complementary", { name: /Device AD-9D14-VV/i }),
    ).toBeDefined();
  });

  it("detail aside surfaces canonical role + binding + policy + heartbeat sections", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("normal")} />);
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    fireEvent.click(screen.getByRole("button", { name: /AD-3A11-REG/ }));
    const detail = screen.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    expect(within(detail).getByText(/Role & binding/i)).toBeDefined();
    expect(within(detail).getByText(/Capability policy/i)).toBeDefined();
    expect(within(detail).getByText(/Heartbeat/i)).toBeDefined();
    expect(within(detail).getByText(/Platform/i)).toBeDefined();
    // Canonical names are surfaced as-is alongside operator labels.
    expect(within(detail).getByText("diagnostics")).toBeDefined();
    expect(within(detail).getByText(/policyVersion/i)).toBeDefined();
    expect(within(detail).getByText(/disabledCapabilities/i)).toBeDefined();
  });

  it("assign / edit policy / retire affordances are disabled in the baseline (no fake live success)", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("normal")} />);
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    const detail = screen.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    // Pending device: assign + retire enabled? No — all three are
    // disabled in this baseline feature per spec ("не притворяться
    // live success"); only their tooltips explain why.
    const assign = within(detail).getByRole("button", {
      name: /assign/i,
    }) as HTMLButtonElement;
    const editPolicy = within(detail).getByRole("button", {
      name: /edit policy/i,
    }) as HTMLButtonElement;
    const retire = within(detail).getByRole("button", {
      name: /retire/i,
    }) as HTMLButtonElement;
    expect(assign.disabled).toBe(true);
    expect(editPolicy.disabled).toBe(true);
    expect(retire.disabled).toBe(true);
  });

  it("retired device disables retire affordance with a 'already retired' tooltip", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("normal")} />);
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    fireEvent.click(screen.getByRole("button", { name: /AD-2E55-RET/ }));
    const detail = screen.getByRole("complementary", {
      name: /Device AD-2E55-RET/i,
    });
    const retire = within(detail).getByRole("button", {
      name: /retire/i,
    }) as HTMLButtonElement;
    expect(retire.disabled).toBe(true);
    expect(retire.getAttribute("title")).toMatch(/already retired/i);
  });

  it("empty scenario renders an EmptyState", async () => {
    render(<AndroidDevicesScreen loader={() => consoleAndroidDevicesFor("empty")} />);
    expect(await screen.findByText(/no devices/i)).toBeDefined();
  });
});
