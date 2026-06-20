import { ApiError } from "@/api/errors";
import { selectFixtures } from "@/api/mock/fixtures";
import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "@/api/mock/scenarios";
import type { components } from "@/contracts/types/media-archive";

export type RecordingItem = components["schemas"]["MediaRecording"];

/**
 * Returns a current snapshot of media-recording fixtures.
 *
 * The canonical media-archive-service OpenAPI contract has no `GET
 * /media/recordings` list operation today (only POST start / segments /
 * finalize and GET manifest). To keep the inspector workspace usable
 * before a list read model lands, this helper reads the same mock
 * fixtures the mock adapter exposes; once a typed list endpoint is
 * added to OpenAPI, the loader should switch to
 * `api.mediaArchive.GET(...)`.
 *
 * For the `service-degraded` scenario the loader throws an
 * `ApiError` with HTTP 503 so the workspace surfaces the
 * `DegradedState` primitive — same shape the live media-archive
 * client will produce.
 */
export function defaultRecordingsLoader(
  scenario?: MockScenario,
): RecordingItem[] {
  const resolved = scenario ?? resolveScenarioFromEnv();
  if (resolved === "service-degraded") {
    throw new ApiError({
      status: 503,
      code: "SERVICE_DEGRADED",
      message: "media-archive-service is degraded in mock scenario",
      url: "/api/media-archive/v1/media/recordings",
      timestamp: "2026-06-19T10:00:00Z",
    });
  }
  return selectFixtures(resolved).recordings;
}

function resolveScenarioFromEnv(): MockScenario {
  const candidate = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  return isMockScenario(candidate) ? candidate : DEFAULT_SCENARIO;
}
