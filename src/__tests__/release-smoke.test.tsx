import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import CandidatesPage from "@/app/(shell)/candidates/page";
import DashboardPage from "@/app/(shell)/dashboard/page";
import EvidencePage from "@/app/(shell)/evidence/page";
import ExamsPage from "@/app/(shell)/exams/page";
import ExercisesPage from "@/app/(shell)/exercises/page";
import OperationsPage from "@/app/(shell)/operations/page";
import RulesPage from "@/app/(shell)/rules/page";
import VehiclesPage from "@/app/(shell)/vehicles/page";
import ViolationsPage from "@/app/(shell)/violations/page";

/**
 * Release smoke. Renders the default export of every shell page with
 * the mock adapter and confirms a level-1 heading shows up — i.e. the
 * page mounted without throwing, the workspace section rendered, and
 * the loader path completed (or at least kicked off) cleanly.
 *
 * This is the smoke half of the release gate. Together with
 * `pnpm contracts:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`
 * (component tests) and `pnpm build`, it covers the shell/navigation/
 * key-pages signal the feature asked for.
 */

beforeAll(() => {
  vi.stubEnv("NEXT_PUBLIC_API_ADAPTER", "mock");
  vi.stubEnv("NEXT_PUBLIC_MOCK_SCENARIO", "normal");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const PAGES = [
  { name: "dashboard", Page: DashboardPage },
  { name: "candidates", Page: CandidatesPage },
  { name: "vehicles", Page: VehiclesPage },
  { name: "exams", Page: ExamsPage },
  { name: "exercises", Page: ExercisesPage },
  { name: "violations", Page: ViolationsPage },
  { name: "rules", Page: RulesPage },
  { name: "evidence", Page: EvidencePage },
  { name: "operations", Page: OperationsPage },
];

describe("Release smoke — shell pages mount with mock adapter", () => {
  for (const { name, Page } of PAGES) {
    it(`mounts /${name}`, async () => {
      render(<Page />);
      // A level-1 heading is the most stable signal across workspaces
      // and survives loading states (header is rendered before data).
      const heading = await screen.findByRole(
        "heading",
        { level: 1 },
        { timeout: 2000 },
      );
      expect(heading.textContent ?? "").not.toBe("");
    });
  }
});
