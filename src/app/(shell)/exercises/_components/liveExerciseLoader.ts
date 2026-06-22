/**
 * Live exercise loader + DTO→view-model mapper + commands.
 *
 * Wires the exercises workspace to the typed `exercise-service`
 * client (`api.exercise.*`). Mock mode keeps using scenario fixtures
 * — this module is only used when `resolveRuntimeMode() === "live"`.
 *
 * Coverage vs. canonical contract (`@/contracts/types/exercise`):
 *
 *   - `GET /exercises` → `liveExercisesLoader` (combined with
 *     groups read).
 *   - `GET /exercises/{exerciseId}` → `liveExerciseGet`.
 *   - `POST /exercises` → `liveExerciseCreate` (Idempotency-Key
 *     per call).
 *   - `POST /exercises/{exerciseId}/publish` → `liveExercisePublish`.
 *   - `GET /exercises/{exerciseId}/versions/{versionId}` →
 *     `liveExerciseGetVersion`.
 *   - `GET /exercise-groups` → `liveExerciseGroupsLoader`.
 *   - `POST /exercise-groups` → `liveExerciseGroupCreate`.
 *
 * Backend gaps documented in the loader (no silent successful
 * "live" actions):
 *
 *   - `PUT/PATCH /exercises/{id}` (update) — **not in canonical
 *     contract**. `liveExerciseUpdate` throws an explicit
 *     `ExerciseUpdateUnsupportedError` so the UI surfaces a
 *     degraded state via the existing `<ApiErrorView>` instead of
 *     faking a successful save. This matches the spec rule "for
 *     unsupported operations make an explicit degraded state or
 *     documented no-op, not pretend successful live action".
 *
 * Mapping notes:
 *
 *   - Canonical `Exercise` carries identity + lifecycle + current
 *     version pointer. The visual surface adds design-only blocks
 *     (`difficulty`, `maxDuration`, `linkedRuleId`) that have no
 *     canonical field yet; mapper assigns safe `"—"` defaults.
 *   - Canonical `ExerciseStatus` is `"draft" | "published" |
 *     "archived"`; the console enum is `"draft" | "published" |
 *     "retired"` — `archived` maps to `retired`.
 *   - `ExerciseGroup` is collapsed to operator-visible `{id, name,
 *     count}`; `count` is computed by joining the exercises list
 *     against `exerciseOrder` (since the canonical group does not
 *     expose a precomputed count).
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/exercise";

import type {
  ConsoleExercise,
  ConsoleExerciseGroup,
  ConsoleExerciseStatus,
  ConsoleExercisesSnapshot,
} from "./consoleExercisesSnapshot";

type ExerciseDto = components["schemas"]["Exercise"];
type ExerciseStatus = components["schemas"]["ExerciseStatus"];
type ExerciseCreationDto = components["schemas"]["ExerciseCreation"];
type ExerciseVersionDraftDto =
  components["schemas"]["ExerciseVersionDraft"];
type ExerciseVersionDto = components["schemas"]["ExerciseVersion"];
type ExerciseGroupDto = components["schemas"]["ExerciseGroup"];
type ExerciseGroupCreationDto =
  components["schemas"]["ExerciseGroupCreation"];
type ExercisesPageDto = components["schemas"]["ExercisesPage"];
type ExerciseGroupsPageDto = components["schemas"]["ExerciseGroupsPage"];

/**
 * Thrown by `liveExerciseUpdate` because the canonical
 * exercise-service does not expose an update endpoint yet. Lets
 * the hook layer surface a degraded `<ApiErrorView>` instead of
 * silently pretending the mutation succeeded.
 */
export class ExerciseUpdateUnsupportedError extends Error {
  readonly code = "EXERCISE_UPDATE_UNSUPPORTED" as const;
  constructor() {
    super(
      "exercise-service does not yet expose an update endpoint — " +
        "see canonical contract gap in feature report.",
    );
    this.name = "ExerciseUpdateUnsupportedError";
  }
}

const STATUS_FOR_DTO: Record<ExerciseStatus, ConsoleExerciseStatus> = {
  draft: "draft",
  published: "published",
  archived: "retired",
};

const STATUS_LABEL: Record<ConsoleExerciseStatus, string> = {
  draft: "draft",
  published: "published",
  retired: "retired",
};

export function mapExerciseStatus(
  status: ExerciseStatus,
): { state: ConsoleExerciseStatus; label: string } {
  const state = STATUS_FOR_DTO[status] ?? "draft";
  return { state, label: STATUS_LABEL[state] };
}

export function mapExerciseDtoToConsole(
  dto: ExerciseDto,
  override?: { groupId?: string },
): ConsoleExercise {
  const status = mapExerciseStatus(dto.status);
  const versionNumber = dto.currentVersion?.versionNumber;
  return {
    id: dto.exerciseId,
    code: dto.code,
    name: dto.title,
    groupId: override?.groupId ?? "—",
    version:
      typeof versionNumber === "number" ? `v${versionNumber}` : "—",
    difficulty: "—",
    maxDuration: "—",
    linkedRuleId: "—",
    status: status.state,
    statusLabel: status.label,
  };
}

export function mapExerciseGroupDtoToConsole(
  dto: ExerciseGroupDto,
): ConsoleExerciseGroup {
  return {
    id: dto.groupId,
    name: dto.title,
    count: dto.exerciseOrder.length,
  };
}

/**
 * Returns a lookup `exerciseId → groupId` from the groups page so
 * that each exercise in the catalog can be associated with the
 * group that lists it. An exercise that is not referenced by any
 * group keeps the `"—"` placeholder.
 */
function buildExerciseToGroupIndex(
  groups: readonly ExerciseGroupDto[],
): Map<string, string> {
  const index = new Map<string, string>();
  for (const g of groups) {
    for (const item of g.exerciseOrder) {
      // First group wins if an exercise is referenced from multiple.
      if (!index.has(item.exerciseId)) {
        index.set(item.exerciseId, g.groupId);
      }
    }
  }
  return index;
}

/**
 * Calls `GET /exercise-groups` + `GET /exercises` and assembles the
 * console snapshot. Both calls run in parallel since the catalog
 * pane and the groups sidebar render side-by-side; latency is the
 * slower of the two, not the sum.
 */
export async function liveExercisesLoader(
  adapter: AutodromeApi,
): Promise<ConsoleExercisesSnapshot> {
  const [groupsResult, exercisesResult] = await Promise.all([
    adapter.exercise.GET("/exercise-groups", {}),
    adapter.exercise.GET("/exercises", {}),
  ]);
  const groupsPage = (groupsResult.data ?? {
    items: [],
  }) as ExerciseGroupsPageDto;
  const exercisesPage = (exercisesResult.data ?? {
    items: [],
  }) as ExercisesPageDto;

  const groupDtos = groupsPage.items ?? [];
  const exerciseDtos = exercisesPage.items ?? [];
  const exerciseToGroup = buildExerciseToGroupIndex(groupDtos);

  const groups = groupDtos.map(mapExerciseGroupDtoToConsole);
  const exercises = exerciseDtos.map((dto) =>
    mapExerciseDtoToConsole(dto, {
      groupId: exerciseToGroup.get(dto.exerciseId),
    }),
  );

  const drafts = exercises.filter((e) => e.status === "draft").length;

  return {
    totals: {
      groups: groups.length,
      exercises: exercises.length,
      drafts,
    },
    groups,
    exercises,
  };
}

/** Convenience: groups-only read. */
export async function liveExerciseGroupsLoader(
  adapter: AutodromeApi,
): Promise<ConsoleExerciseGroup[]> {
  const result = await adapter.exercise.GET("/exercise-groups", {});
  const page = (result.data ?? { items: [] }) as ExerciseGroupsPageDto;
  return (page.items ?? []).map(mapExerciseGroupDtoToConsole);
}

/** GET /exercises/{exerciseId} — single exercise read. */
export async function liveExerciseGet(
  adapter: AutodromeApi,
  exerciseId: string,
): Promise<ConsoleExercise> {
  const result = await adapter.exercise.GET("/exercises/{exerciseId}", {
    params: { path: { exerciseId } },
  });
  const dto = result.data as ExerciseDto | undefined;
  if (!dto) {
    throw new Error("exercise-service returned an empty body");
  }
  return mapExerciseDtoToConsole(dto);
}

/**
 * POST /exercises — create. Fresh `Idempotency-Key` per call so
 * retries don't create duplicates.
 */
export async function liveExerciseCreate(
  adapter: AutodromeApi,
  creation: ExerciseCreationDto,
): Promise<ConsoleExercise> {
  const result = await adapter.exercise.POST("/exercises", {
    params: {
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: creation,
  });
  const dto = result.data as ExerciseDto | undefined;
  if (!dto) {
    throw new Error(
      "exercise-service returned an empty body for POST /exercises",
    );
  }
  return mapExerciseDtoToConsole(dto);
}

/**
 * POST /exercises/{exerciseId}/publish — materialise a new
 * immutable `ExerciseVersion`. Returns the updated parent Exercise
 * (which now points at the freshly-published version via
 * `currentVersion`).
 */
export async function liveExercisePublish(
  adapter: AutodromeApi,
  exerciseId: string,
  draft: ExerciseVersionDraftDto,
): Promise<ConsoleExercise> {
  const result = await adapter.exercise.POST(
    "/exercises/{exerciseId}/publish",
    {
      params: {
        path: { exerciseId },
        header: { "Idempotency-Key": newCorrelationId() },
      },
      body: draft,
    },
  );
  const dto = result.data as ExerciseDto | undefined;
  if (!dto) {
    throw new Error(
      "exercise-service returned an empty body for publish",
    );
  }
  return mapExerciseDtoToConsole(dto);
}

/**
 * GET /exercises/{exerciseId}/versions/{versionId} — read a
 * specific historic version snapshot (returned as raw DTO; mapping
 * to a console-side type is deferred until UI surfaces version
 * history). Useful for audit / debugging flows.
 */
export async function liveExerciseGetVersion(
  adapter: AutodromeApi,
  exerciseId: string,
  versionId: string,
): Promise<ExerciseVersionDto> {
  const result = await adapter.exercise.GET(
    "/exercises/{exerciseId}/versions/{versionId}",
    {
      params: { path: { exerciseId, versionId } },
    },
  );
  const dto = result.data as ExerciseVersionDto | undefined;
  if (!dto) {
    throw new Error(
      "exercise-service returned an empty body for version",
    );
  }
  return dto;
}

/**
 * POST /exercise-groups — create a new group. Fresh
 * `Idempotency-Key` per call.
 */
export async function liveExerciseGroupCreate(
  adapter: AutodromeApi,
  creation: ExerciseGroupCreationDto,
): Promise<ConsoleExerciseGroup> {
  const result = await adapter.exercise.POST("/exercise-groups", {
    params: {
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: creation,
  });
  const dto = result.data as ExerciseGroupDto | undefined;
  if (!dto) {
    throw new Error(
      "exercise-service returned an empty body for POST /exercise-groups",
    );
  }
  return mapExerciseGroupDtoToConsole(dto);
}

/**
 * Update operation is not exposed by the canonical
 * exercise-service contract. Throws so the UI surfaces a degraded
 * state instead of silently pretending the mutation succeeded.
 *
 * The signature is kept for forward-compat: when backend ships an
 * update endpoint this becomes a real POST/PATCH wiring.
 */
export async function liveExerciseUpdate(
  _adapter: AutodromeApi,
  _exerciseId: string,
  _update: Partial<ExerciseCreationDto>,
): Promise<ConsoleExercise> {
  throw new ExerciseUpdateUnsupportedError();
}
