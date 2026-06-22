/**
 * Live rules loader + DTO→view-model mappers + commands.
 *
 * Wires the rules workspace to the typed `violation-rule-service`
 * client (`api.violationRule.*`). Mock mode keeps using scenario
 * fixtures — this module runs only when
 * `resolveRuntimeMode() === "live"`.
 *
 * Coverage vs. canonical contract (`@/contracts/types/violation-rule`):
 *
 *   - `GET /rules` → `liveRulesLoader`.
 *   - `GET /rules/{ruleId}` → `liveRuleGet` (optional `ruleVersion`).
 *   - `POST /rules` → `liveRuleCreate` (Idempotency-Key per call).
 *   - `POST /rules/{ruleId}/publish` → `liveRulePublish`.
 *
 * Backend gap (documented):
 *
 *   - `PUT/PATCH /rules/{ruleId}` (edit/update of a draft) — **not
 *     in canonical contract**. `liveRuleUpdate` throws an explicit
 *     `RuleUpdateUnsupportedError` so the UI surfaces a degraded
 *     state via `<ApiErrorView>` instead of pretending the
 *     mutation succeeded. The forward-compat signature lets the
 *     stub flip to a real POST/PATCH wiring when backend ships
 *     the endpoint.
 *
 * Mapping notes:
 *
 *   - Canonical `RuleDefinition` carries identity + lifecycle +
 *     `ruleVersion` + opaque `conditionTree`/`actions`/`inputs`.
 *     The console surface adds design-only blocks
 *     (`conditionPreview`, `history`) that have no canonical
 *     read-model yet; mapper assigns safe defaults (empty arrays
 *     with a documented placeholder) so the read-only preview pane
 *     in `RulesScreen` keeps rendering without inventing condition
 *     strings.
 *   - `version` label is rendered as `v{ruleVersion}`.
 *   - `updated` falls back through `updatedAt ?? publishedAt ??
 *     createdAt` so the visual timestamp is always populated.
 *   - Editor dirty-state preservation: this loader does NOT write
 *     into editor-local React state — it only returns immutable
 *     snapshots. The hook layer is responsible for guarding the
 *     editor's dirty-state on reload (current `RulesScreen` is a
 *     read-only preview, so the requirement is vacuous in code
 *     terms; documented for the upcoming editor feature).
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/violation-rule";

import type {
  ConsoleRule,
  ConsoleRuleHistoryEntry,
  ConsoleRuleStatus,
  ConsoleRulesSnapshot,
} from "./consoleRulesSnapshot";

type RuleDefinitionDto = components["schemas"]["RuleDefinition"];
type RuleStatus = components["schemas"]["RuleStatus"];
type RuleDraftDto = components["schemas"]["RuleDraft"];
type RulePublishRequestDto =
  components["schemas"]["RulePublishRequest"];
type RulesPageDto = components["schemas"]["RulesPage"];

/**
 * Thrown by `liveRuleUpdate` because the canonical
 * violation-rule-service does not yet expose an edit/update
 * endpoint for an existing draft. Surfaces a degraded UI state
 * instead of silently pretending the mutation succeeded.
 */
export class RuleUpdateUnsupportedError extends Error {
  readonly code = "RULE_UPDATE_UNSUPPORTED" as const;
  constructor() {
    super(
      "violation-rule-service does not yet expose a rule update/edit " +
        "endpoint — see canonical contract gap in feature report. " +
        "Use POST /rules to create a new draft, or POST /rules/{id}/publish " +
        "to materialise a new version with an updated condition tree.",
    );
    this.name = "RuleUpdateUnsupportedError";
  }
}

const STATUS_LABEL: Record<RuleStatus, string> = {
  draft: "draft",
  published: "published",
  archived: "archived",
};

export function mapRuleStatus(status: RuleStatus): {
  state: ConsoleRuleStatus;
  label: string;
} {
  return { state: status, label: STATUS_LABEL[status] };
}

/**
 * Default placeholder lines for the design-only `conditionPreview`
 * block. The full condition-tree → human-readable preview lives
 * inside the upcoming rule editor feature; until then live mode
 * renders an explicit "preview not available" line instead of
 * inventing condition text from raw JSON.
 */
function defaultConditionPreview(
  dto: RuleDefinitionDto,
): readonly string[] {
  if (dto.conditionTree) {
    return [
      "Condition tree available in backend snapshot.",
      "Preview rendered once the rule editor ships (planned).",
    ];
  }
  return ["No condition tree attached yet."];
}

export function mapRuleDtoToConsole(
  dto: RuleDefinitionDto,
  history: readonly ConsoleRuleHistoryEntry[] = [],
): ConsoleRule {
  const status = mapRuleStatus(dto.status);
  const updated =
    dto.updatedAt ?? dto.publishedAt ?? dto.createdAt;
  return {
    id: dto.ruleId,
    name: dto.title ?? "—",
    version: `v${dto.ruleVersion}`,
    status: status.state,
    statusLabel: status.label,
    updated,
    conditionPreview: [...defaultConditionPreview(dto)],
    history: [...history],
  };
}

function countByStatus(
  rules: readonly ConsoleRule[],
  target: ConsoleRuleStatus,
): number {
  return rules.filter((r) => r.status === target).length;
}

/**
 * `GET /rules` — paginated list read. Loader maps the first page
 * into a `ConsoleRulesSnapshot` (totals + rule rows). Pagination
 * wiring is deferred until UI scroll triggers; see report
 * tech-debt section.
 */
export async function liveRulesLoader(
  adapter: AutodromeApi,
): Promise<ConsoleRulesSnapshot> {
  const result = await adapter.violationRule.GET("/rules", {});
  const page = (result.data ?? { items: [] }) as RulesPageDto;
  const rules = (page.items ?? []).map((dto) =>
    mapRuleDtoToConsole(dto),
  );
  return {
    totals: {
      rules: rules.length,
      drafts: countByStatus(rules, "draft"),
      published: countByStatus(rules, "published"),
    },
    rules,
  };
}

/**
 * `GET /rules/{ruleId}` — single rule read. Optional `ruleVersion`
 * fetches a specific historical version snapshot.
 */
export async function liveRuleGet(
  adapter: AutodromeApi,
  ruleId: string,
  ruleVersion?: number,
): Promise<ConsoleRule> {
  const result = await adapter.violationRule.GET(
    "/rules/{ruleId}",
    {
      params: {
        path: { ruleId },
        ...(ruleVersion !== undefined
          ? { query: { ruleVersion } }
          : {}),
      },
    },
  );
  const dto = result.data as RuleDefinitionDto | undefined;
  if (!dto) {
    throw new Error(
      "violation-rule-service returned an empty body for /rules/{ruleId}",
    );
  }
  return mapRuleDtoToConsole(dto);
}

/**
 * `POST /rules` — create a draft rule. A fresh `Idempotency-Key`
 * is generated per call so retries don't create duplicates.
 */
export async function liveRuleCreate(
  adapter: AutodromeApi,
  draft: RuleDraftDto,
): Promise<ConsoleRule> {
  const result = await adapter.violationRule.POST("/rules", {
    params: {
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: draft,
  });
  const dto = result.data as RuleDefinitionDto | undefined;
  if (!dto) {
    throw new Error(
      "violation-rule-service returned an empty body for POST /rules",
    );
  }
  return mapRuleDtoToConsole(dto);
}

/**
 * `POST /rules/{ruleId}/publish` — promote a draft into a new
 * immutable published version. Returns the updated rule (now
 * pointing at the freshly-materialised `ruleVersion`).
 */
export async function liveRulePublish(
  adapter: AutodromeApi,
  ruleId: string,
  request: RulePublishRequestDto,
): Promise<ConsoleRule> {
  const result = await adapter.violationRule.POST(
    "/rules/{ruleId}/publish",
    {
      params: {
        path: { ruleId },
        header: { "Idempotency-Key": newCorrelationId() },
      },
      body: request,
    },
  );
  const dto = result.data as RuleDefinitionDto | undefined;
  if (!dto) {
    throw new Error(
      "violation-rule-service returned an empty body for publish",
    );
  }
  return mapRuleDtoToConsole(dto);
}

/**
 * Edit/update an existing rule draft. The canonical
 * violation-rule-service does NOT currently expose this endpoint
 * (no `PUT/PATCH /rules/{ruleId}`). To preserve the spec rule "for
 * unsupported operations make an explicit degraded state, not
 * pretend successful live action", this function always throws
 * `RuleUpdateUnsupportedError`.
 *
 * The forward-compat signature mirrors the future POST/PATCH body
 * shape so the call sites do not change when the backend ships
 * the endpoint.
 */
export async function liveRuleUpdate(
  _adapter: AutodromeApi,
  _ruleId: string,
  _update: Partial<RuleDraftDto>,
): Promise<ConsoleRule> {
  throw new RuleUpdateUnsupportedError();
}
