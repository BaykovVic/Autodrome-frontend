import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { BackupsPanel } from "@/app/(shell)/operations/_components/BackupsPanel";
import type { BackupSnapshot } from "@/app/(shell)/operations/_components/backups";

const SNAPSHOTS: BackupSnapshot[] = [
  {
    id: "snap-test-complete",
    createdAt: "2026-06-18T22:00:00Z",
    kind: "full",
    status: "completed",
    sizeMb: 1024,
  },
  {
    id: "snap-test-failed",
    createdAt: "2026-06-19T09:30:00Z",
    kind: "full",
    status: "failed",
    sizeMb: 0,
    description: "Investigate disk space.",
  },
];

describe("BackupsPanel", () => {
  it("renders snapshots and disables Restore for non-completed backups", () => {
    render(<BackupsPanel snapshots={SNAPSHOTS} />);
    expect(screen.getByText(/snap-test-complete/i)).toBeDefined();
    expect(screen.getByText(/snap-test-failed/i)).toBeDefined();

    const restoreButtons = screen.getAllByRole("button", {
      name: /restore \(preview\)/i,
    }) as HTMLButtonElement[];
    expect(restoreButtons[0].disabled).toBe(false);
    expect(restoreButtons[1].disabled).toBe(true);
  });

  it("create-backup confirm cancel leaves activity empty", () => {
    render(<BackupsPanel snapshots={SNAPSHOTS} />);
    fireEvent.click(
      screen.getByRole("button", { name: /create backup \(preview\)/i }),
    );
    expect(
      screen.getByText(/Create a new backup\?/i),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(
      screen.getByText(
        /No backup or restore requests have been recorded/i,
      ),
    ).toBeDefined();
  });

  it("create-backup confirm records pending-wiring entry without executing", () => {
    render(<BackupsPanel snapshots={SNAPSHOTS} />);
    fireEvent.click(
      screen.getByRole("button", { name: /create backup \(preview\)/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /record backup request/i }),
    );
    expect(screen.getByText(/pending wiring/i)).toBeDefined();
    expect(
      screen.getByText(
        /Create backup request recorded at .* Nothing was changed/i,
      ),
    ).toBeDefined();
  });

  it("restore confirm includes destructive warning and snapshot id, then records pending-wiring", () => {
    render(<BackupsPanel snapshots={SNAPSHOTS} />);
    const restoreButtons = screen.getAllByRole("button", {
      name: /restore \(preview\)/i,
    });
    fireEvent.click(restoreButtons[0]);

    expect(screen.getByText(/Restore from snapshot\?/i)).toBeDefined();
    expect(
      screen.getByText(/Restore is destructive/i),
    ).toBeDefined();
    // Snapshot id appears in the confirm description.
    expect(screen.getAllByText(/snap-test-complete/).length).toBeGreaterThan(
      1,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /record restore request/i }),
    );
    expect(
      screen.getByText(
        /Restore from snap-test-complete request recorded at .* Nothing was changed/i,
      ),
    ).toBeDefined();
  });
});
