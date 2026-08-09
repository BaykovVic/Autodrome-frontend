import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/reference-data",
}));

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import { GeometryScreen } from "@/app/(shell)/autodrome-geometry/_components/GeometryScreen";
import { consoleGeometryFor } from "@/app/(shell)/autodrome-geometry/_components/consoleGeometryFixtures";
import { liveGeometryLoader } from "@/app/(shell)/autodrome-geometry/_components/liveGeometryLoader";
import { ReferenceDataScreen } from "@/app/(shell)/reference-data/_components/ReferenceDataScreen";
import { consoleReferenceDataFor } from "@/app/(shell)/reference-data/_components/consoleReferenceDataFixtures";
import { liveReferenceDataLoader } from "@/app/(shell)/reference-data/_components/liveReferenceDataLoader";

function forbidden(url: string): ApiError {
  return new ApiError({
    status: 403,
    code: "FORBIDDEN",
    message: "denied",
    url,
  });
}

function degraded(url: string): ApiError {
  return new ApiError({
    status: 503,
    code: "SERVICE_DEGRADED",
    message: "service degraded",
    url,
  });
}

function refAdapter(GET: unknown): AutodromeApi {
  return { referenceData: { GET } } as unknown as AutodromeApi;
}

function geoAdapter(GET: unknown): AutodromeApi {
  return { autodromeGeometry: { GET } } as unknown as AutodromeApi;
}

describe("liveReferenceDataLoader", () => {
  const DICTS = [{ dictionary: "examCategories", label: "Exam categories" }];

  it("reads GET /reference/{dictionary} and maps items", async () => {
    const GET = vi.fn(async () => ({
      data: {
        dictionary: "examCategories",
        version: 4,
        items: [
          { dictionary: "examCategories", itemId: "i1", code: "B", title: "Cat B" },
        ],
      },
    }));
    const snap = await liveReferenceDataLoader(refAdapter(GET), DICTS);
    expect(GET).toHaveBeenCalledWith("/reference/{dictionary}", {
      params: { path: { dictionary: "examCategories" } },
    });
    expect(snap.dictionaries[0].version).toBe(4);
    expect(snap.dictionaries[0].items[0].code).toBe("B");
    // Publish metadata is not part of this read — never invented.
    expect(snap.dictionaries[0].publishedAt).toBeNull();
    expect(snap.dictionaries[0].checksumShort).toBeNull();
  });

  it("skips a forbidden dictionary but notes it when others load", async () => {
    const GET = vi
      .fn()
      .mockRejectedValueOnce(forbidden("/reference/examCategories"))
      .mockResolvedValueOnce({
        data: { dictionary: "vehicleKinds", version: 1, items: [] },
      });
    const snap = await liveReferenceDataLoader(refAdapter(GET), [
      { dictionary: "examCategories", label: "Exam categories" },
      { dictionary: "vehicleKinds", label: "Vehicle kinds" },
    ]);
    expect(snap.dictionaries).toHaveLength(1);
    expect(snap.degradedNote).toMatch(/1 of 2/);
  });

  it("propagates the error when every dictionary read fails (403)", async () => {
    const GET = vi.fn(async () => {
      throw forbidden("/reference/examCategories");
    });
    await expect(
      liveReferenceDataLoader(refAdapter(GET), DICTS),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("liveGeometryLoader", () => {
  it("reads GET /geometry and maps objects without inventing status", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          {
            geometryId: "g1",
            type: "zone",
            name: "Parking zone",
            srid: 4326,
            coordinates: {},
            createdAt: "2026-01-01T00:00:00Z",
          },
          {
            geometryId: "g2",
            type: "line",
            srid: 4326,
            coordinates: {},
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
    }));
    const snap = await liveGeometryLoader(geoAdapter(GET));
    expect(GET).toHaveBeenCalledWith("/geometry", {});
    expect(snap.entries[0].name).toBe("Parking zone");
    // Unnamed object falls back to its canonical type, not a made-up name.
    expect(snap.entries[1].name).toBe("line");
    expect(snap.entries[0].status).toBeNull();
    expect(snap.entries[0].version).toBeNull();
    expect(snap.entries[0].checksumShort).toBeNull();
  });

  it("returns an empty entry list without a note when backend has none", async () => {
    const GET = vi.fn(async () => ({ data: { items: [] } }));
    const snap = await liveGeometryLoader(geoAdapter(GET));
    expect(snap.entries).toEqual([]);
    expect(snap.degradedNote).toBeUndefined();
  });
});

describe("ReferenceDataScreen", () => {
  it("mock path renders fixture dictionaries unchanged", async () => {
    render(
      <ReferenceDataScreen loader={() => consoleReferenceDataFor("normal")} />,
    );
    await screen.findByRole("heading", { level: 1, name: /reference data/i });
    expect(
      screen.getByRole("group", { name: /dictionary picker/i }),
    ).toBeDefined();
  });

  it("live path renders backend items and '—' for absent publish metadata", async () => {
    const GET = vi.fn(async () => ({
      data: {
        dictionary: "examCategories",
        version: 2,
        items: [
          { dictionary: "examCategories", itemId: "i1", code: "C1", title: "Cat" },
        ],
      },
    }));
    render(
      <ReferenceDataScreen
        loader={() =>
          liveReferenceDataLoader(refAdapter(GET), [
            { dictionary: "examCategories", label: "Exam categories" },
          ])
        }
      />,
    );
    await screen.findByRole("heading", { level: 1, name: /reference data/i });
    expect(await screen.findByText("C1")).toBeDefined();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("empty backend result renders the no-dictionaries state", async () => {
    render(
      <ReferenceDataScreen
        loader={() => ({
          dictionaries: [],
          selectedDictionary: "",
        })}
      />,
    );
    expect(
      await screen.findByText(/no dictionaries returned/i),
    ).toBeDefined();
  });

  it("403 renders a forbidden error panel, not an empty screen", async () => {
    render(
      <ReferenceDataScreen
        loader={() => {
          throw forbidden("/api/reference-data/v1/reference/examCategories");
        }}
      />,
    );
    expect(
      await screen.findByLabelText(/error category forbidden/i),
    ).toBeDefined();
  });

  it("degraded backend renders the classified error with retry", async () => {
    render(
      <ReferenceDataScreen
        loader={() => {
          throw degraded("/api/reference-data/v1/reference/examCategories");
        }}
      />,
    );
    expect(
      await screen.findByLabelText(/error category degraded/i),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
  });
});

describe("GeometryScreen", () => {
  it("mock path renders fixture entries unchanged", async () => {
    render(<GeometryScreen loader={() => consoleGeometryFor("normal")} />);
    await screen.findByRole("heading", {
      level: 1,
      name: /autodrome geometry/i,
    });
    expect(
      screen.getByRole("table", { name: /geometry versions/i }),
    ).toBeDefined();
  });

  it("live path renders objects with '—' for status/version/checksum", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          {
            geometryId: "g1",
            type: "zone",
            name: "Zone A",
            srid: 4326,
            coordinates: {},
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
    }));
    render(<GeometryScreen loader={() => liveGeometryLoader(geoAdapter(GET))} />);
    expect(await screen.findByText("Zone A")).toBeDefined();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("empty backend result renders the no-entries state", async () => {
    render(<GeometryScreen loader={() => ({ entries: [] })} />);
    expect(
      await screen.findByText(/no geometry versions returned/i),
    ).toBeDefined();
  });

  it("403 renders a forbidden error panel", async () => {
    render(
      <GeometryScreen
        loader={() => {
          throw forbidden("/api/autodrome-geometry/v1/geometry");
        }}
      />,
    );
    expect(
      await screen.findByLabelText(/error category forbidden/i),
    ).toBeDefined();
  });

  it("degraded backend renders the classified error with retry", async () => {
    render(
      <GeometryScreen
        loader={() => {
          throw degraded("/api/autodrome-geometry/v1/geometry");
        }}
      />,
    );
    expect(
      await screen.findByLabelText(/error category degraded/i),
    ).toBeDefined();
  });
});
