import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/exams",
}));

import { ExamProtocolPanel } from "@/app/(shell)/exams/_components/ExamProtocolPanel";
import type { ConsoleProtocolRequestResult } from "@/app/(shell)/reporting/_components/liveReportingLoader";
import type { ConsoleReportingTemplate } from "@/app/(shell)/reporting/_components/consoleReportingSnapshot";

const TEMPLATES: ConsoleReportingTemplate[] = [
  {
    templateId: "TPL-A",
    name: "Standard exam protocol",
    reportType: "examProtocol",
    reportTypeLabel: "Exam protocol",
    version: 3,
    publishedAt: "2026-06-20T09:00:00Z",
  },
  {
    templateId: "TPL-B",
    name: "Aborted exam protocol",
    reportType: "examProtocol",
    reportTypeLabel: "Exam protocol",
    version: 1,
    publishedAt: "2026-06-22T09:00:00Z",
  },
];

const READY_RESULT: ConsoleProtocolRequestResult = {
  reportId: "REP-1",
  examId: "EXM-1",
  status: "ready",
  statusLabel: "Ready",
  degraded: false,
  missingEvidence: [],
  snapshotHash: "sha256:fixt",
  violationCount: 3,
  mediaCount: 4,
  audioCount: 1,
  biometryCount: 2,
  generatedAt: "2026-06-28T09:55:00Z",
};

describe("ExamProtocolPanel", () => {
  it("renders the templates select and a Generate button (disabled when canGenerate=false)", async () => {
    render(
      <ExamProtocolPanel
        examId="EXM-1"
        canGenerate={false}
        templatesLoader={() => TEMPLATES}
        generator={() => READY_RESULT}
      />,
    );
    const select = (await screen.findByRole("combobox", {
      name: /protocol template/i,
    })) as HTMLSelectElement;
    expect(select.value).toBe("TPL-A");
    const btn = screen.getByRole("button", {
      name: /generate protocol/i,
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("title")).toMatch(
      /after the exam result is calculated/i,
    );
  });

  it("enables Generate when canGenerate=true and templates loaded; click invokes generator with selected templateId", async () => {
    const generator = vi.fn(() => READY_RESULT);
    render(
      <ExamProtocolPanel
        examId="EXM-1"
        canGenerate={true}
        templatesLoader={() => TEMPLATES}
        generator={generator}
      />,
    );
    const select = (await screen.findByRole("combobox", {
      name: /protocol template/i,
    })) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "TPL-B" } });
    const btn = screen.getByRole("button", {
      name: /generate protocol/i,
    });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(generator).toHaveBeenCalledWith("TPL-B");
    // Result rendered.
    const status = screen.getByRole("status");
    expect(within(status).getByText(/Ready/)).toBeDefined();
    // Snapshot + counts.
    expect(within(status).getByText(/sha256:fixt/)).toBeDefined();
    expect(within(status).getByText(/REP-1/)).toBeDefined();
  });

  it("renders a degraded result with the Degraded result badge + missing-evidence chips", async () => {
    const degraded: ConsoleProtocolRequestResult = {
      ...READY_RESULT,
      degraded: true,
      missingEvidence: ["violation:VR-7", "media:MED-9"],
    };
    render(
      <ExamProtocolPanel
        examId="EXM-1"
        canGenerate={true}
        templatesLoader={() => TEMPLATES}
        generator={() => degraded}
      />,
    );
    const btn = await screen.findByRole("button", {
      name: /generate protocol/i,
    });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(screen.getByText(/Degraded result/i)).toBeDefined();
    const chips = screen.getByLabelText(/missing evidence references/i);
    expect(within(chips).getByText("violation:VR-7")).toBeDefined();
    expect(within(chips).getByText("media:MED-9")).toBeDefined();
  });

  it("surfaces generator rejection as inline alert", async () => {
    const generator = vi.fn(async () => {
      throw new Error("backend 503");
    });
    render(
      <ExamProtocolPanel
        examId="EXM-1"
        canGenerate={true}
        templatesLoader={() => TEMPLATES}
        generator={generator}
      />,
    );
    const btn = await screen.findByRole("button", {
      name: /generate protocol/i,
    });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/backend 503/i)).toBeDefined();
  });

  it("surfaces template-loader rejection as an inline error message", async () => {
    render(
      <ExamProtocolPanel
        examId="EXM-1"
        canGenerate={true}
        templatesLoader={async () => {
          throw new Error("templates down");
        }}
        generator={() => READY_RESULT}
      />,
    );
    expect(
      await screen.findByText(/templates down/i),
    ).toBeDefined();
    const btn = screen.getByRole("button", {
      name: /generate protocol/i,
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("shows 'No templates published' message when loader returns an empty list", async () => {
    render(
      <ExamProtocolPanel
        examId="EXM-1"
        canGenerate={true}
        templatesLoader={() => []}
        generator={() => READY_RESULT}
      />,
    );
    expect(
      await screen.findByText(/no templates published/i),
    ).toBeDefined();
  });
});
