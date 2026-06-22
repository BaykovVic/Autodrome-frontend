import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import {
  ExerciseUpdateUnsupportedError,
  liveExerciseCreate,
  liveExerciseGet,
  liveExerciseGetVersion,
  liveExerciseGroupCreate,
  liveExerciseGroupsLoader,
  liveExercisePublish,
  liveExerciseUpdate,
  liveExercisesLoader,
  mapExerciseDtoToConsole,
  mapExerciseGroupDtoToConsole,
  mapExerciseStatus,
} from "@/app/(shell)/exercises/_components/liveExerciseLoader";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/exercise";

type ExerciseDto = components["schemas"]["Exercise"];
type ExerciseGroupDto = components["schemas"]["ExerciseGroup"];

function makeExercise(over: Partial<ExerciseDto> = {}): ExerciseDto {
  return {
    exerciseId: "00000000-0000-0000-0000-0000000000e1",
    code: "EX-101",
    title: "Vehicle start & stop",
    status: "published",
    createdAt: "2026-06-22T09:00:00Z",
    ...over,
  };
}

function makeGroup(over: Partial<ExerciseGroupDto> = {}): ExerciseGroupDto {
  return {
    groupId: "grp-basic",
    title: "Basic skills",
    exerciseOrder: [
      { exerciseId: "00000000-0000-0000-0000-0000000000e1" },
      { exerciseId: "00000000-0000-0000-0000-0000000000e2" },
    ],
    categoryRefs: [],
    createdAt: "2026-06-22T09:00:00Z",
    ...over,
  };
}

function makeExerciseApi(
  exercise: Partial<AutodromeApi["exercise"]>,
): AutodromeApi {
  return { exercise } as unknown as AutodromeApi;
}

describe("liveExerciseLoader: mappers (pure)", () => {
  it("maps a published exercise to console view-model", () => {
    const v = mapExerciseDtoToConsole(
      makeExercise({
        exerciseId: "ex-X",
        currentVersion: {
          versionId: "ver-1",
          versionNumber: 3,
          publishedAt: "2026-06-22T10:00:00Z",
        },
      }),
      { groupId: "grp-basic" },
    );
    expect(v.id).toBe("ex-X");
    expect(v.code).toBe("EX-101");
    expect(v.name).toBe("Vehicle start & stop");
    expect(v.groupId).toBe("grp-basic");
    expect(v.version).toBe("v3");
    expect(v.status).toBe("published");
    expect(v.statusLabel).toBe("published");
    expect(v.difficulty).toBe("—");
    expect(v.maxDuration).toBe("—");
    expect(v.linkedRuleId).toBe("—");
  });

  it("maps draft exercise correctly", () => {
    const v = mapExerciseDtoToConsole(makeExercise({ status: "draft" }));
    expect(v.status).toBe("draft");
    expect(v.statusLabel).toBe("draft");
  });

  it("maps canonical 'archived' to console 'retired'", () => {
    const v = mapExerciseDtoToConsole(makeExercise({ status: "archived" }));
    expect(v.status).toBe("retired");
    expect(v.statusLabel).toBe("retired");
  });

  it("defaults version label to '—' when no currentVersion", () => {
    expect(mapExerciseDtoToConsole(makeExercise()).version).toBe("—");
  });

  it("defaults groupId to '—' when no override supplied", () => {
    expect(mapExerciseDtoToConsole(makeExercise()).groupId).toBe("—");
  });

  it("mapExerciseStatus is total", () => {
    expect(mapExerciseStatus("draft").state).toBe("draft");
    expect(mapExerciseStatus("published").state).toBe("published");
    expect(mapExerciseStatus("archived").state).toBe("retired");
  });

  it("maps an exercise group: count = exerciseOrder.length", () => {
    const g = mapExerciseGroupDtoToConsole(makeGroup());
    expect(g.id).toBe("grp-basic");
    expect(g.name).toBe("Basic skills");
    expect(g.count).toBe(2);
  });

  it("maps an empty exercise group to count 0", () => {
    expect(
      mapExerciseGroupDtoToConsole(makeGroup({ exerciseOrder: [] })).count,
    ).toBe(0);
  });
});

describe("liveExercisesLoader: combined catalog + groups read", () => {
  it("calls both endpoints in parallel and maps a snapshot", async () => {
    const groupsPage: components["schemas"]["ExerciseGroupsPage"] = {
      items: [
        makeGroup({
          groupId: "grp-basic",
          title: "Basic skills",
          exerciseOrder: [
            { exerciseId: "ex-1" },
            { exerciseId: "ex-2" },
          ],
        }),
        makeGroup({
          groupId: "grp-slalom",
          title: "Slalom",
          exerciseOrder: [{ exerciseId: "ex-3" }],
        }),
      ],
    };
    const exercisesPage: components["schemas"]["ExercisesPage"] = {
      items: [
        makeExercise({ exerciseId: "ex-1", code: "EX-101", status: "published" }),
        makeExercise({ exerciseId: "ex-2", code: "EX-102", status: "draft" }),
        makeExercise({ exerciseId: "ex-3", code: "EX-201", status: "published" }),
        makeExercise({ exerciseId: "ex-orphan", code: "EX-301", status: "draft" }),
      ],
    };

    const GET = vi.fn(async (path: string) =>
      path === "/exercise-groups"
        ? { data: groupsPage }
        : { data: exercisesPage },
    );
    const api = makeExerciseApi({
      GET: GET as unknown as AutodromeApi["exercise"]["GET"],
    });

    const snapshot = await liveExercisesLoader(api);

    expect(GET).toHaveBeenCalledTimes(2);
    expect(snapshot.totals.groups).toBe(2);
    expect(snapshot.totals.exercises).toBe(4);
    expect(snapshot.totals.drafts).toBe(2);
    // First two exercises are linked to basic; third to slalom; orphan → "—"
    const byId = new Map(snapshot.exercises.map((e) => [e.id, e.groupId]));
    expect(byId.get("ex-1")).toBe("grp-basic");
    expect(byId.get("ex-2")).toBe("grp-basic");
    expect(byId.get("ex-3")).toBe("grp-slalom");
    expect(byId.get("ex-orphan")).toBe("—");
  });

  it("returns empty snapshot when both endpoints return empty pages", async () => {
    const GET = vi.fn(async () => ({ data: { items: [] } }));
    const api = makeExerciseApi({
      GET: GET as unknown as AutodromeApi["exercise"]["GET"],
    });
    const snapshot = await liveExercisesLoader(api);
    expect(snapshot).toEqual({
      totals: { groups: 0, exercises: 0, drafts: 0 },
      groups: [],
      exercises: [],
    });
  });

  it("propagates ApiError thrown by the client middleware", async () => {
    const GET = vi.fn(() => {
      throw new ApiError({
        status: 503,
        code: "SERVICE_DEGRADED",
        message: "exercise-service degraded",
        url: "/api/exercise/v1/exercises",
      });
    });
    const api = makeExerciseApi({
      GET: GET as unknown as AutodromeApi["exercise"]["GET"],
    });
    await expect(liveExercisesLoader(api)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("liveExerciseGroupsLoader (groups only)", () => {
  it("calls GET /exercise-groups and maps to console groups", async () => {
    const GET = vi.fn(async () => ({
      data: { items: [makeGroup()] },
    }));
    const api = makeExerciseApi({
      GET: GET as unknown as AutodromeApi["exercise"]["GET"],
    });
    const groups = await liveExerciseGroupsLoader(api);
    expect(GET).toHaveBeenCalledWith("/exercise-groups", {});
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe("grp-basic");
  });
});

describe("liveExerciseGet / liveExerciseCreate / liveExercisePublish / liveExerciseGetVersion", () => {
  it("GET /exercises/{id}: passes path param and maps DTO", async () => {
    const dto = makeExercise({ exerciseId: "ex-X" });
    const GET = vi.fn(async () => ({ data: dto }));
    const api = makeExerciseApi({
      GET: GET as unknown as AutodromeApi["exercise"]["GET"],
    });

    const v = await liveExerciseGet(api, "ex-X");

    expect(GET).toHaveBeenCalledWith("/exercises/{exerciseId}", {
      params: { path: { exerciseId: "ex-X" } },
    });
    expect(v.id).toBe("ex-X");
  });

  it("GET /exercises/{id}: throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeExerciseApi({
      GET: GET as unknown as AutodromeApi["exercise"]["GET"],
    });
    await expect(liveExerciseGet(api, "ex-Z")).rejects.toThrow(
      /empty body/i,
    );
  });

  it("POST /exercises: attaches Idempotency-Key + body", async () => {
    const created = makeExercise({ exerciseId: "ex-NEW" });
    const POST = vi.fn(async () => ({ data: created }));
    const api = makeExerciseApi({
      POST: POST as unknown as AutodromeApi["exercise"]["POST"],
    });

    const body: components["schemas"]["ExerciseCreation"] = {
      code: "EX-NEW",
      title: "Newly created",
    };
    const v = await liveExerciseCreate(api, body);

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: { header: { "Idempotency-Key": string } };
        body: components["schemas"]["ExerciseCreation"];
      },
    ];
    expect(path).toBe("/exercises");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(body);
    expect(v.id).toBe("ex-NEW");
  });

  it("POST /exercises: each call uses a fresh Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({ data: makeExercise() }));
    const api = makeExerciseApi({
      POST: POST as unknown as AutodromeApi["exercise"]["POST"],
    });
    await liveExerciseCreate(api, { code: "EX-1", title: "A" });
    await liveExerciseCreate(api, { code: "EX-2", title: "B" });
    const [, opts1] = POST.mock.calls[0] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    const [, opts2] = POST.mock.calls[1] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    expect(opts1.params.header["Idempotency-Key"]).not.toBe(
      opts2.params.header["Idempotency-Key"],
    );
  });

  it("POST /exercises: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeExerciseApi({
      POST: POST as unknown as AutodromeApi["exercise"]["POST"],
    });
    await expect(
      liveExerciseCreate(api, { code: "EX-X", title: "X" }),
    ).rejects.toThrow(/empty body/i);
  });

  it("POST /exercises: propagates ApiError", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 422,
        code: "VALIDATION",
        message: "code conflict",
        url: "/api/exercise/v1/exercises",
      });
    });
    const api = makeExerciseApi({
      POST: POST as unknown as AutodromeApi["exercise"]["POST"],
    });
    await expect(
      liveExerciseCreate(api, { code: "EX-X", title: "X" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("POST /exercises/{id}/publish: forwards path + header + body", async () => {
    const dto = makeExercise({
      exerciseId: "ex-P",
      status: "published",
      currentVersion: {
        versionId: "ver-1",
        versionNumber: 1,
        publishedAt: "2026-06-22T10:00:00Z",
      },
    });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeExerciseApi({
      POST: POST as unknown as AutodromeApi["exercise"]["POST"],
    });

    const draft: components["schemas"]["ExerciseVersionDraft"] = {
      rulesRefs: [],
      geometryRefs: [],
      errors: [],
    };
    const v = await liveExercisePublish(api, "ex-P", draft);

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { exerciseId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["ExerciseVersionDraft"];
      },
    ];
    expect(path).toBe("/exercises/{exerciseId}/publish");
    expect(opts.params.path.exerciseId).toBe("ex-P");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(draft);
    expect(v.status).toBe("published");
    expect(v.version).toBe("v1");
  });

  it("POST /exercises/{id}/publish: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeExerciseApi({
      POST: POST as unknown as AutodromeApi["exercise"]["POST"],
    });
    await expect(
      liveExercisePublish(api, "ex-P", {
        rulesRefs: [],
        geometryRefs: [],
        errors: [],
      }),
    ).rejects.toThrow(/empty body/i);
  });

  it("GET /exercises/{id}/versions/{versionId}: returns DTO as-is", async () => {
    const version: components["schemas"]["ExerciseVersion"] = {
      versionId: "ver-1",
      exerciseId: "ex-V",
      versionNumber: 2,
      publishedAt: "2026-06-22T10:00:00Z",
      publishedBy: { actorId: "actor-1", actorType: "user" },
      rulesRefs: [],
      geometryRefs: [],
      errors: [],
    };
    const GET = vi.fn(async () => ({ data: version }));
    const api = makeExerciseApi({
      GET: GET as unknown as AutodromeApi["exercise"]["GET"],
    });

    const v = await liveExerciseGetVersion(api, "ex-V", "ver-1");

    expect(GET).toHaveBeenCalledWith(
      "/exercises/{exerciseId}/versions/{versionId}",
      { params: { path: { exerciseId: "ex-V", versionId: "ver-1" } } },
    );
    expect(v).toBe(version);
  });

  it("GET version: throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeExerciseApi({
      GET: GET as unknown as AutodromeApi["exercise"]["GET"],
    });
    await expect(
      liveExerciseGetVersion(api, "ex-V", "ver-x"),
    ).rejects.toThrow(/empty body/i);
  });
});

describe("liveExerciseGroupCreate", () => {
  it("POST /exercise-groups: attaches Idempotency-Key + body + maps response", async () => {
    const dto = makeGroup({ groupId: "grp-NEW", title: "Brand new" });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeExerciseApi({
      POST: POST as unknown as AutodromeApi["exercise"]["POST"],
    });

    const body: components["schemas"]["ExerciseGroupCreation"] = {
      title: "Brand new",
      exerciseOrder: [{ exerciseId: "ex-1" }],
      categoryRefs: [],
    };
    const g = await liveExerciseGroupCreate(api, body);

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: { header: { "Idempotency-Key": string } };
        body: components["schemas"]["ExerciseGroupCreation"];
      },
    ];
    expect(path).toBe("/exercise-groups");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(body);
    expect(g.id).toBe("grp-NEW");
    expect(g.name).toBe("Brand new");
    expect(g.count).toBe(2);
  });

  it("POST /exercise-groups: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeExerciseApi({
      POST: POST as unknown as AutodromeApi["exercise"]["POST"],
    });
    await expect(
      liveExerciseGroupCreate(api, {
        title: "X",
        exerciseOrder: [],
        categoryRefs: [],
      }),
    ).rejects.toThrow(/empty body/i);
  });
});

describe("liveExerciseUpdate: explicit degraded state (unsupported backend op)", () => {
  it("always throws ExerciseUpdateUnsupportedError", async () => {
    const api = makeExerciseApi({});
    await expect(
      liveExerciseUpdate(api, "ex-Z", { title: "renamed" }),
    ).rejects.toBeInstanceOf(ExerciseUpdateUnsupportedError);
  });

  it("error carries a stable machine-readable code", async () => {
    const api = makeExerciseApi({});
    try {
      await liveExerciseUpdate(api, "ex-Z", {});
      throw new Error("expected ExerciseUpdateUnsupportedError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ExerciseUpdateUnsupportedError);
      expect((err as ExerciseUpdateUnsupportedError).code).toBe(
        "EXERCISE_UPDATE_UNSUPPORTED",
      );
      expect((err as Error).message).toMatch(/update endpoint/i);
    }
  });
});
