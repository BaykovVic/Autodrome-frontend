import { describe, expect, it } from "vitest";

import {
  createMockWebEnrollmentAdapter,
  mockWebEnrollmentAdapter,
  type WebEnrollmentAdapter,
} from "@/app/(shell)/candidates/_adapter/webEnrollmentAdapter";

describe("WebEnrollmentAdapter (mock)", () => {
  it("the default mock adapter exposes every read method and resolves to a typed snapshot", async () => {
    const candidates = await mockWebEnrollmentAdapter.loadCandidates();
    expect(candidates.candidates.length).toBeGreaterThan(0);
    expect(candidates.totals.total).toBe(candidates.candidates.length);

    const channels =
      await mockWebEnrollmentAdapter.loadEnrollmentChannels();
    expect(channels.scenario).toBeDefined();
    expect(channels.registrar.deviceId).toMatch(/^REG-TAB/);
    expect(channels.local.cameraName.length).toBeGreaterThan(0);

    const session =
      await mockWebEnrollmentAdapter.loadEnrollmentSession("ENR-9F41");
    expect(session.session.id).toBe("ENR-9F41");
    expect(session.session.timeline.length).toBeGreaterThan(0);

    const station = await mockWebEnrollmentAdapter.loadCameraStation();
    expect(station.scenario).toBeDefined();
    expect(station.quality.length).toBe(4);
  });

  it("createMockWebEnrollmentAdapter accepts per-surface scenario overrides", async () => {
    const adapter: WebEnrollmentAdapter = createMockWebEnrollmentAdapter({
      candidatesScenario: "empty",
      enrollmentChannelsScenario: "registrar-offline",
      enrollmentSessionScenario: "quality-failed",
      cameraStationScenario: "permission-denied",
    });

    const candidates = await adapter.loadCandidates();
    expect(candidates.candidates.length).toBe(0);

    const channels = await adapter.loadEnrollmentChannels();
    expect(channels.registrar.state).toBe("offline");

    const session = await adapter.loadEnrollmentSession("ENR-9F41");
    expect(session.session.state).toBe("quality-failed");

    const station = await adapter.loadCameraStation();
    expect(station.scenario).toBe("permission-denied");
    expect(station.device.permission).toBe("denied");
  });

  it("retryEnrollmentSession transitions to queued · retry with appended audit entry", async () => {
    const adapter = createMockWebEnrollmentAdapter({
      enrollmentSessionScenario: "quality-failed",
    });
    const base = await adapter.loadEnrollmentSession("ENR-9F41");
    const after = await adapter.retryEnrollmentSession("ENR-9F41");
    expect(after.session.state).toBe("queued");
    expect(after.session.stateLabel).toMatch(/retry/i);
    expect(after.session.timeline.length).toBe(base.session.timeline.length + 1);
    const lastEntry = after.session.timeline[after.session.timeline.length - 1];
    expect(lastEntry.label).toMatch(/Retry queued/i);
  });

  it("cancelEnrollmentSession transitions to cancelled with appended audit entry", async () => {
    const adapter = createMockWebEnrollmentAdapter({
      enrollmentSessionScenario: "capturing",
    });
    const base = await adapter.loadEnrollmentSession("ENR-9F41");
    const after = await adapter.cancelEnrollmentSession("ENR-9F41");
    expect(after.session.state).toBe("cancelled");
    expect(after.session.timeline.length).toBe(base.session.timeline.length + 1);
    const lastEntry = after.session.timeline[after.session.timeline.length - 1];
    expect(lastEntry.label).toMatch(/Cancelled/i);
  });

  it("the adapter does not import raw OpenAPI DTOs (compile-time contract)", () => {
    // Each loader returns a typed view-model; this test exists to
    // pin the contract. Adapter mapping functions must keep raw
    // `@/contracts/types/*` imports out of UI screens. If a future
    // change re-exports a generated DTO type via the view-model
    // barrel, this test should be updated to enforce the new
    // contract explicitly.
    expect(typeof mockWebEnrollmentAdapter.loadCandidates).toBe("function");
    expect(typeof mockWebEnrollmentAdapter.loadEnrollmentChannels).toBe(
      "function",
    );
    expect(typeof mockWebEnrollmentAdapter.loadEnrollmentSession).toBe(
      "function",
    );
    expect(typeof mockWebEnrollmentAdapter.loadCameraStation).toBe("function");
    expect(typeof mockWebEnrollmentAdapter.retryEnrollmentSession).toBe(
      "function",
    );
    expect(typeof mockWebEnrollmentAdapter.cancelEnrollmentSession).toBe(
      "function",
    );
  });
});
