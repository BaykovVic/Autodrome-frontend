import { describe, expect, it } from "vitest";

import { MOCK_SCENARIOS, selectFixtures } from "@/api/mock";

describe("mock fixtures", () => {
  it("provides data for every declared scenario", () => {
    for (const scenario of MOCK_SCENARIOS) {
      const fixtures = selectFixtures(scenario);
      expect(fixtures).toMatchObject({
        candidates: expect.any(Array),
        vehicles: expect.any(Array),
        exams: expect.any(Array),
        exercises: expect.any(Array),
        violations: expect.any(Array),
        rules: expect.any(Array),
      });
    }
  });

  it("empty scenario returns empty collections", () => {
    const fixtures = selectFixtures("empty");
    expect(fixtures.candidates).toEqual([]);
    expect(fixtures.vehicles).toEqual([]);
    expect(fixtures.exams).toEqual([]);
    expect(fixtures.exercises).toEqual([]);
    expect(fixtures.violations).toEqual([]);
    expect(fixtures.rules).toEqual([]);
  });

  it("exam-in-progress scenario contains an active exam", () => {
    const fixtures = selectFixtures("exam-in-progress");
    const inProgress = fixtures.exams.find((e) => e.status === "inProgress");
    expect(inProgress).toBeDefined();
  });

  it("violations-detected scenario yields critical severity violations", () => {
    const fixtures = selectFixtures("violations-detected");
    const critical = fixtures.violations.find(
      (v) => v.severity === "critical",
    );
    expect(critical).toBeDefined();
  });
});
