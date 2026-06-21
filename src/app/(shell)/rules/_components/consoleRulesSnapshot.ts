/**
 * Console-shaped rules snapshot.
 *
 * Backend Rule contract has ruleId/version/status. The visual surface
 * adds design-only blocks (read-only condition preview, version
 * history). Visual condition tree EDITOR is explicitly out of scope —
 * design shows it tagged "EDITOR · PLANNED" and renders a read-only
 * preview only; live editor ships in a later milestone.
 */
export type ConsoleRuleStatus = "draft" | "published" | "archived";

export type ConsoleRuleHistoryEntry = {
  id: string;
  version: string;
  state: ConsoleRuleStatus;
  stateLabel: string;
  updated: string;
};

export type ConsoleRule = {
  id: string;
  name: string;
  version: string;
  status: ConsoleRuleStatus;
  statusLabel: string;
  updated: string;
  conditionPreview: string[];
  history: ConsoleRuleHistoryEntry[];
};

export type ConsoleRulesSnapshot = {
  totals: {
    rules: number;
    drafts: number;
    published: number;
  };
  rules: ConsoleRule[];
};
