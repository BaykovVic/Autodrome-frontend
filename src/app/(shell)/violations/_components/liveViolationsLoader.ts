/**
 * Live violations loader + DTO→view-model mappers + commands.
 *
 * Wires the violations workspace to the typed
 * `violation-rule-service` client (`api.violationRule.*`).
 * Mock mode keeps using scenario fixtures — this module runs only
 * when `resolveRuntimeMode() === "live"`.
 *
 * Coverage vs. canonical contract (`@/contracts/types/violation-rule`):
 *
 *   - `GET /violations` → `liveViolationsLoader`.
 *   - `GET /violations/{violationId}` → `liveViolationGet`.
 *   - `POST /violations` → `liveViolationCreate` (Idempotency-Key
 *     per call).
 *
 * Backend gap (documented):
 *
 *   - The canonical Violation DTO carries identity + severity +
 *     `activeRuleVersion` only. Operator-facing design-only blocks
 *     (`penalty`, `requiredEvidence[]`, `status="active"|"deprecated"`)
 *     have no canonical owner yet; mapper assigns safe defaults
 *     (`penalty: "—"`, `requiredEvidence: []`, `status: "active"`)
 *     so the violation catalog renders without inventing numbers.
 *     A future violation-policy extension will populate them.
 *
 * Severity vocabulary translation:
 *
 *   The canonical Severity enum is `low | medium | high | critical`.
 *   The console enum is `critical | major | minor` (operator-facing
 *   shorthand). Mapping is conservative — `critical` and `high` both
 *   map to console `critical`, `medium` → `major`, `low` → `minor`.
 *   Documented in JSDoc + report for review traceability.
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/violation-rule";

import type {
  ConsoleViolation,
  ConsoleViolationSeverity,
  ConsoleViolationsSnapshot,
} from "./consoleViolationsSnapshot";

type ViolationDto = components["schemas"]["Violation"];
type ViolationCreationDto = components["schemas"]["ViolationCreation"];
type ViolationsPageDto = components["schemas"]["ViolationsPage"];
type Severity = components["schemas"]["Severity"];

/**
 * Canonical severity → console severity mapping. Total: every
 * `Severity` enum value resolves to a `ConsoleViolationSeverity`
 * (no silent fallthrough).
 */
const SEVERITY_FOR_DTO: Record<Severity, ConsoleViolationSeverity> = {
  critical: "critical",
  high: "critical",
  medium: "major",
  low: "minor",
};

const SEVERITY_LABEL: Record<ConsoleViolationSeverity, string> = {
  critical: "critical",
  major: "major",
  minor: "minor",
};

export function mapViolationSeverity(severity: Severity): {
  state: ConsoleViolationSeverity;
  label: string;
} {
  const state = SEVERITY_FOR_DTO[severity];
  return { state, label: SEVERITY_LABEL[state] };
}

export function mapViolationDtoToConsole(
  dto: ViolationDto,
): ConsoleViolation {
  const severity = mapViolationSeverity(dto.severity);
  const status: ConsoleViolation["status"] = "active";
  return {
    id: dto.violationId,
    code: dto.code,
    name: dto.title,
    severity: severity.state,
    severityLabel: severity.label,
    // The canonical Violation DTO does not carry a numeric penalty
    // yet — design-only block defaults to "—" until a violation
    // policy extension lands. Documented as tech-debt.
    penalty: "—",
    status,
    statusLabel: status,
    ruleId: dto.activeRuleVersion?.ruleId ?? "—",
    // No canonical owner for evidence kinds yet.
    requiredEvidence: [],
  };
}

function countByStatus(
  violations: readonly ConsoleViolation[],
  target: ConsoleViolation["status"],
): number {
  return violations.filter((v) => v.status === target).length;
}

/**
 * `GET /violations` — paginated list read. Maps the first page
 * into a `ConsoleViolationsSnapshot`.
 *
 * `activeRule` (banner across the top of the screen) defaults to
 * the first violation's `activeRuleVersion` when present —
 * matches the visual surface convention of showing the
 * currently-active rule binding. If no violation has an active
 * rule, falls back to `{id: "—", version: "—"}`.
 */
export async function liveViolationsLoader(
  adapter: AutodromeApi,
): Promise<ConsoleViolationsSnapshot> {
  const result = await adapter.violationRule.GET("/violations", {});
  const page = (result.data ?? { items: [] }) as ViolationsPageDto;
  const dtos = page.items ?? [];
  const violations = dtos.map(mapViolationDtoToConsole);
  const firstActive = dtos.find((v) => v.activeRuleVersion);
  const activeRule = firstActive?.activeRuleVersion
    ? {
        id: firstActive.activeRuleVersion.ruleId,
        version: `v${firstActive.activeRuleVersion.ruleVersion}`,
      }
    : { id: "—", version: "—" };
  return {
    activeRule,
    totals: {
      violations: violations.length,
      active: countByStatus(violations, "active"),
      deprecated: countByStatus(violations, "deprecated"),
    },
    violations,
  };
}

/** `GET /violations/{violationId}` — single violation read. */
export async function liveViolationGet(
  adapter: AutodromeApi,
  violationId: string,
): Promise<ConsoleViolation> {
  const result = await adapter.violationRule.GET(
    "/violations/{violationId}",
    {
      params: { path: { violationId } },
    },
  );
  const dto = result.data as ViolationDto | undefined;
  if (!dto) {
    throw new Error(
      "violation-rule-service returned an empty body for /violations/{violationId}",
    );
  }
  return mapViolationDtoToConsole(dto);
}

/**
 * `POST /violations` — create a catalog entry. A fresh
 * `Idempotency-Key` is generated per call so retries don't create
 * duplicates.
 */
export async function liveViolationCreate(
  adapter: AutodromeApi,
  creation: ViolationCreationDto,
): Promise<ConsoleViolation> {
  const result = await adapter.violationRule.POST("/violations", {
    params: {
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: creation,
  });
  const dto = result.data as ViolationDto | undefined;
  if (!dto) {
    throw new Error(
      "violation-rule-service returned an empty body for POST /violations",
    );
  }
  return mapViolationDtoToConsole(dto);
}
