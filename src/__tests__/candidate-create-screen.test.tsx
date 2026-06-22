import { describe, expect, it, vi, beforeEach } from "vitest";
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
  usePathname: () => "/candidates/new",
}));

import { CandidateCreateScreen } from "@/app/(shell)/candidates/_components/CandidateCreateScreen";
import { consoleEnrollmentChannelsFor } from "@/app/(shell)/candidates/_components/consoleEnrollmentChannelsFixtures";

beforeEach(() => {
  // happy-dom does not implement `<dialog>.showModal()` natively;
  // stub the prototype so the Modal primitive does not throw and tests
  // can probe dialog content without forcing actual show/close cycles.
  const proto = (
    globalThis.HTMLDialogElement as unknown as { prototype: HTMLElement }
  ).prototype;
  if (proto && !("showModal" in proto)) {
    Object.defineProperty(proto, "showModal", {
      configurable: true,
      writable: true,
      value: function showModal(this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    });
    Object.defineProperty(proto, "close", {
      configurable: true,
      writable: true,
      value: function close(this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    });
  }
});

describe("CandidateCreateScreen", () => {
  it("renders breadcrumb, title, info banner and all form fields", () => {
    render(<CandidateCreateScreen />);
    expect(
      screen.getByRole("heading", { level: 1, name: /create candidate/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: /candidates registry/i }),
    ).toBeDefined();
    expect(screen.getByText(/New candidate/i)).toBeDefined();
    expect(
      screen.getByText(/Face enrollment is performed separately/i),
    ).toBeDefined();
    expect(screen.getByLabelText(/full name/i)).toBeDefined();
    expect(screen.getByLabelText(/date of birth/i)).toBeDefined();
    expect(screen.getByLabelText(/document \/ license/i)).toBeDefined();
    expect(screen.getByLabelText(/exam category/i)).toBeDefined();
    expect(screen.getByLabelText(/status/i)).toBeDefined();
  });

  it("shows the assigned mock candidate id before save", () => {
    render(<CandidateCreateScreen assignedCandidateId="CND-2026-TEST" />);
    // The id appears in the form's `Candidate id will be assigned on
    // save:` line and is also inlined into the hidden enrollment
    // dialog. Both are valid; assert at least one rendering exists.
    expect(screen.getAllByText(/CND-2026-TEST/).length).toBeGreaterThan(0);
  });

  it("surfaces validation errors only after the user attempts to save", () => {
    render(<CandidateCreateScreen />);
    // No errors visible before submit.
    expect(
      screen.queryByText(/Enter the candidate's full name/i),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /^save candidate$/i }),
    );
    expect(
      screen.getByText(/Enter the candidate's full name/i),
    ).toBeDefined();
    expect(
      screen.getByText(/Use DD\.MM\.YYYY/i),
    ).toBeDefined();
    expect(
      screen.getByText(/Enter the document or license reference/i),
    ).toBeDefined();
  });

  it("Save with valid input transitions to saved state and shows the assigned id", () => {
    render(<CandidateCreateScreen assignedCandidateId="CND-2026-TEST" />);
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Anna Petrova" },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "12.04.2001" },
    });
    fireEvent.change(screen.getByLabelText(/document \/ license/i), {
      target: { value: "DL-77-014562" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^save candidate$/i }),
    );
    const banner = screen.getByRole("status");
    expect(within(banner).getByText("CND-2026-TEST")).toBeDefined();
    expect(
      within(banner).getByText(/Candidate saved as/i),
    ).toBeDefined();
  });

  it("Save and start enrollment opens the dialog only after valid save", () => {
    render(<CandidateCreateScreen />);
    // Empty submit — dialog must NOT open.
    fireEvent.click(
      screen.getByRole("button", { name: /save and start enrollment/i }),
    );
    expect(
      screen.queryByRole("dialog", { name: /start face enrollment/i }),
    ).toBeNull();
    // Fill in valid data, retry.
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Anna Petrova" },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "12.04.2001" },
    });
    fireEvent.change(screen.getByLabelText(/document \/ license/i), {
      target: { value: "DL-77-014562" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save and start enrollment/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /start face enrollment/i }),
    ).toBeDefined();
  });

  it("Cancel renders a Link to the candidates registry", () => {
    render(<CandidateCreateScreen />);
    const link = screen.getByRole("link", { name: /^cancel$/i });
    expect(link.getAttribute("href")).toBe("/candidates");
  });

  it("changing form input after Save resets the saved banner", () => {
    render(<CandidateCreateScreen />);
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Anna Petrova" },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "12.04.2001" },
    });
    fireEvent.change(screen.getByLabelText(/document \/ license/i), {
      target: { value: "DL-77-014562" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^save candidate$/i }),
    );
    expect(
      screen.getByText(/Candidate saved as/i),
    ).toBeDefined();
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Anna Petrovna" },
    });
    expect(
      screen.queryByText(/Candidate saved as/i),
    ).toBeNull();
    expect(
      screen.getByText(/Face enrollment is performed separately/i),
    ).toBeDefined();
  });

  it("passes the registrar-online enrollment channels snapshot to the dialog by default", () => {
    render(
      <CandidateCreateScreen
        channels={consoleEnrollmentChannelsFor("registrar-online")}
      />,
    );
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Anna Petrova" },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "12.04.2001" },
    });
    fireEvent.change(screen.getByLabelText(/document \/ license/i), {
      target: { value: "DL-77-014562" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save and start enrollment/i }),
    );
    const dialog = screen.getByRole("dialog", {
      name: /start face enrollment/i,
    });
    expect(within(dialog).getByText("REG-TAB-02")).toBeDefined();
    expect(
      within(dialog).getByText(/Online · assigned/i),
    ).toBeDefined();
  });
});
