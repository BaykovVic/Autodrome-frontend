# Web enrollment view-model + adapter boundary

This folder is the **single boundary** between the Web enrollment UI
and whatever backs the data. Today the data is mock scenarios. When
backend orchestration ships, a live adapter implementing the same
interface plugs in without rewriting layout, hooks or tests.

## Files

- `webEnrollmentViewModels.ts` — barrel of every **typed view-model**
  the Web enrollment surfaces consume. UI components import types
  only from here (or, transitively, from the surface-local snapshot
  files that this barrel re-exports). UI components **must not**
  import raw OpenAPI DTOs from `@/contracts/types/*`.

- `webEnrollmentAdapter.ts` — declares the `WebEnrollmentAdapter`
  interface and ships `createMockWebEnrollmentAdapter()` /
  `mockWebEnrollmentAdapter` (default mock instance). The interface
  is the **only** allowed bridge between OpenAPI DTOs and the
  view-models above.

## View-models

| Spec name | View-model type | Surface |
| --- | --- | --- |
| Candidate registry row | `ConsoleCandidate` (in `ConsoleCandidatesSnapshot.candidates[]`) | `/candidates` (CandidatesScreen, table row) |
| Candidate detail | `ConsoleCandidate` identity + `enrollment` block | `/candidates` (CandidatesScreen, detail aside) |
| Enrollment state | `CandidateEnrollmentState` (9-value union) | candidate detail Face enrollment panel; session monitor state badge |
| Enrollment channel | `EnrollmentChannelsSnapshot` | StartEnrollmentDialog channel picker |
| Registrar device | `RegistrarChannelState` | StartEnrollmentDialog registrar detail card |
| Local camera station | `CameraStationSnapshot` | `/candidates/sessions/[id]/camera-station` (CameraStationScreen) + `/capture/[id]` (CaptureWindowSurface) |
| Enrollment session | `EnrollmentSession` (in `EnrollmentSessionSnapshot.session`) | `/candidates/sessions/[id]` (EnrollmentSessionMonitor) |
| Session timeline event | `EnrollmentSessionTimelineEntry` | EnrollmentSessionMonitor audit timeline |

## Adapter contract

```ts
interface WebEnrollmentAdapter {
  loadCandidates(): Promise<ConsoleCandidatesSnapshot>;
  loadEnrollmentChannels(): Promise<EnrollmentChannelsSnapshot>;
  loadEnrollmentSession(sessionId: string): Promise<EnrollmentSessionSnapshot>;
  loadCameraStation(): Promise<CameraStationSnapshot>;

  retryEnrollmentSession(sessionId: string): Promise<EnrollmentSessionSnapshot>;
  cancelEnrollmentSession(sessionId: string): Promise<EnrollmentSessionSnapshot>;
}
```

- **Read methods** always return view-models (`Console*Snapshot` /
  `Enrollment*Snapshot` / `CameraStation*`), never raw OpenAPI DTOs.
- **Command methods** return the resulting view-model so the screen
  can render the new state directly. The mock adapter replays the
  same overlay behaviour the screens use today (timeline append +
  state transition).
- All methods are `async` so a live adapter can perform network calls
  without the interface changing shape.

## Hooks vs adapter today

Hooks (`useConsoleCandidates`, `useConsoleEnrollmentChannels` /
`useConsoleEnrollmentSession` / `useConsoleCameraStation`) currently
accept a `loader?: () => Promise<Snapshot>` for DI. That is the
**simpler form** of the adapter boundary — one method per hook. The
adapter interface here documents the **full canonical method shape**
so the next refactor (when live transport ships) can wire hooks to a
single adapter instance without rewriting their tests.

## Mock adapter usage

```ts
import { createMockWebEnrollmentAdapter } from
  "@/app/(shell)/candidates/_adapter/webEnrollmentAdapter";

const adapter = createMockWebEnrollmentAdapter({
  candidatesScenario: "normal",
  enrollmentSessionScenario: "ttl-warning",
});

const snapshot = await adapter.loadEnrollmentSession("ENR-9F41");
```

The default `mockWebEnrollmentAdapter` exported from the same file
mirrors each surface's env-driven default scenario.

## Missing canonical contracts

The mock adapter currently masks the following gaps. When backend
orchestration ships these endpoints, the live adapter implementation
should consume them and map their DTOs into the view-models above.

### 1. `GET /candidates`

- **Canonical contract:** none. `@/contracts/types/candidate` defines
  the per-record `Candidate` shape but not a list endpoint.
- **What we mask:** mask of DOB into `**.**.YYYY`, eligibility chip,
  9-value enrollment state, `templateStatus` / `sourceDevice` /
  `lastEnrollment` summary fields. These are operator-facing
  derivations, not canonical state.
- **When backend ships:** the live adapter calls `GET /candidates`,
  maps Candidate DTO + biometry-service per-candidate state into
  `ConsoleCandidate[]`.

### 2. `GET /enrollment-channels`

- **Canonical contract:** none. Registrar device discovery is owned
  by a service that does not yet expose a typed endpoint.
- **What we mask:** registrar tablet identity (`REG-TAB-02`),
  station label, last-seen / battery / network summary, local
  camera detection status, permission-granted boolean and
  second-monitor copy.
- **When backend ships:** live adapter calls device discovery
  endpoint, maps DTO + browser `MediaDevices` enumeration into
  `EnrollmentChannelsSnapshot`. Browser permission probe lands here
  as well (currently mocked).

### 3. `GET /enrollment-sessions/{id}`

- **Canonical contract:** none.
- **What we mask:** 8-state session lifecycle (queued / accepted /
  capturing / ttl-warning / quality-failed / finalized / expired /
  cancelled), TTL countdown string, target device + station,
  per-event audit timeline (label / note / time / tone).
- **When backend ships:** live adapter calls session read model and
  maps backend session DTO into `EnrollmentSession`. Live timeline
  arrives via the live event stream (see «event stream» below).

### 4. `POST /enrollment-sessions/{id}/commands/{retry|cancel}`

- **Canonical contract:** none. The Web Operator Console wants to
  re-send the enrollment command (Retry) or cancel an in-flight
  session (Cancel) — both currently land on a local override + mock
  status panel.
- **What we mask:** transition to `queued` (retry) / `cancelled`
  (cancel) + appended timeline entry («Retry queued» / «Cancelled»).
- **When backend ships:** live adapter posts the command, waits for
  the next session snapshot from the read model (or live event
  stream), and returns it.

### 5. `GET /camera-stations/{id}`

- **Canonical contract:** none. Camera station device state +
  capture progress have no current backend owner.
- **What we mask:** selected camera device (model + meta +
  permission), capture-window kind (closed / open / done / cancelled),
  4-bar quality progress (Lighting / Sharpness / Face position /
  Stability), per-capture frame counter + best-frame label, capture
  quality checks (Face in oval / Eyes open / Hold still).
- **When backend ships:** live adapter sources device state from
  Web `MediaDevices` enumeration + biometry-service per-frame quality
  feedback.

### 6. Live event stream

- **Canonical contract:** none. Session state transitions
  (`queued → accepted → capturing → …`) are static per snapshot
  today.
- **What's required for live:** a server-sent-events stream or
  WebSocket that pushes new `EnrollmentSession` snapshots as state
  evolves. The hook layer (`useConsoleEnrollmentSession`) will
  subscribe and re-render. No protocol changes needed in the
  view-models or screens.

## Constraint — do not regress

When a live adapter ships:

- **Do not change view-model shapes** without coordinated frontend
  changes — the screens render against these shapes directly.
- **Do not leak raw OpenAPI DTOs** into UI components — the adapter
  is the single bridge.
- **Do not change deterministic mock behaviour** of Retry / Cancel /
  Done / Open capture window: those mock-only transitions exist
  because Codex reviews repeatedly required enabled primary actions
  to have visible, testable mock state. Live transitions should
  produce the same visible status panels and audit timeline entries
  the mock adapter produces today.
- **Do not introduce `getUserMedia` / `RTCPeerConnection` / image
  upload** before the Web visual/model boundary stage is sealed.
  The capture window is intentionally a mock surface for now.
