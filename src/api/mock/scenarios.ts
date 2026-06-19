export const MOCK_SCENARIOS = [
  "empty",
  "normal",
  "exam-in-progress",
  "violations-detected",
  "service-degraded",
] as const;

export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export const DEFAULT_SCENARIO: MockScenario = "normal";

export function isMockScenario(value: unknown): value is MockScenario {
  return (
    typeof value === "string" &&
    (MOCK_SCENARIOS as readonly string[]).includes(value)
  );
}
