import { selectFixtures } from "@/api/mock/fixtures";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import type { components } from "@/contracts/types/exam";

export type ExamItem = components["schemas"]["Exam"];

/**
 * Helper that returns a current snapshot of exam fixtures.
 *
 * The canonical exam-service OpenAPI contract has NO `GET /exams` list
 * operation in the MVP API surface (only `POST /exams`, `GET
 * /exams/{examId}`, lifecycle endpoints and `GET /exams/{examId}/timeline`).
 *
 * To keep the operator workspace usable before backend introduces a list
 * read model, this helper reads the same mock fixtures the mock adapter
 * exposes. Once a typed list endpoint lands in OpenAPI, the loader should
 * switch to `api.exam.GET("/exams", ...)`. The mock adapter typed POST
 * handlers for `/exams` and its lifecycle endpoints are reused unchanged.
 */
export function defaultExamsLoader(scenario?: MockScenario): ExamItem[] {
  const resolved = scenario ?? resolveScenarioFromEnv();
  return selectFixtures(resolved).exams;
}

function resolveScenarioFromEnv(): MockScenario {
  const candidate = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  return isMockScenario(candidate) ? candidate : DEFAULT_SCENARIO;
}
