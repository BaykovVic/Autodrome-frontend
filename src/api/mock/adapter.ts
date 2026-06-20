import type { AutodromeApi } from "../adapter";
import { createAutodromeClient } from "../client";
import { createMockFetch } from "./fetch";
import { DEFAULT_SCENARIO, type MockScenario } from "./scenarios";
import type { CandidatePaths } from "../services/candidate";
import type { ExamPaths } from "../services/exam";
import type { ExercisePaths } from "../services/exercise";
import type { MediaArchivePaths } from "../services/media-archive";
import type { VehiclePaths } from "../services/vehicle";
import type { ViolationRulePaths } from "../services/violation-rule";

export function createMockAdapter(
  scenario: MockScenario = DEFAULT_SCENARIO,
): AutodromeApi {
  const mockFetch = createMockFetch(scenario);

  return {
    candidate: createAutodromeClient<CandidatePaths>({
      baseUrl: "/api/candidate/v1",
      fetch: mockFetch,
    }),
    vehicle: createAutodromeClient<VehiclePaths>({
      baseUrl: "/api/vehicle/v1",
      fetch: mockFetch,
    }),
    exam: createAutodromeClient<ExamPaths>({
      baseUrl: "/api/exam/v1",
      fetch: mockFetch,
    }),
    exercise: createAutodromeClient<ExercisePaths>({
      baseUrl: "/api/exercise/v1",
      fetch: mockFetch,
    }),
    violationRule: createAutodromeClient<ViolationRulePaths>({
      baseUrl: "/api/violation-rule/v1",
      fetch: mockFetch,
    }),
    mediaArchive: createAutodromeClient<MediaArchivePaths>({
      baseUrl: "/api/media-archive/v1",
      fetch: mockFetch,
    }),
  };
}
