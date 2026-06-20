"use client";

import { useMemo, useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  Input,
  StatusBadge,
  Textarea,
} from "@/components";
import type { components } from "@/contracts/types/violation-rule";
import type { RuleDefinition } from "./useRulesData";
import styles from "./RuleEditorForm.module.css";

type RulePublishRequest = components["schemas"]["RulePublishRequest"];
type ConditionTree = components["schemas"]["ConditionTree"];
type ObjectDescriptor = Record<string, unknown>;

type Props = {
  api: AutodromeApi;
  rule: RuleDefinition;
  onPublished: (next: RuleDefinition) => void;
};

type ParseResult<T> =
  | { ok: true; value: T | undefined }
  | { ok: false; message: string };

const EMPTY_OBJECT_TEXT = "{}";
const EMPTY_ARRAY_TEXT = "[]";

function pretty(value: unknown, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return fallback;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseConditions(text: string): ParseResult<ConditionTree> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: {} };
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!isPlainObject(parsed)) {
      return {
        ok: false,
        message: "Conditions must be a JSON object.",
      };
    }
    return { ok: true, value: parsed };
  } catch (error) {
    return {
      ok: false,
      message: `Invalid JSON: ${(error as Error).message}`,
    };
  }
}

function parseObjectArray(
  text: string,
  fieldLabel: string,
): ParseResult<ObjectDescriptor[]> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: undefined };
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      return {
        ok: false,
        message: `${fieldLabel} must be a JSON array.`,
      };
    }
    if (!parsed.every(isPlainObject)) {
      return {
        ok: false,
        message: `${fieldLabel} must be an array of JSON objects.`,
      };
    }
    return { ok: true, value: parsed as ObjectDescriptor[] };
  } catch (error) {
    return {
      ok: false,
      message: `Invalid JSON: ${(error as Error).message}`,
    };
  }
}

export function RuleEditorForm({ api, rule, onPublished }: Props) {
  const initialConditions = useMemo(
    () => pretty(rule.conditionTree, EMPTY_OBJECT_TEXT),
    [rule.conditionTree],
  );
  const initialInputs = useMemo(
    () => pretty(rule.inputs, EMPTY_ARRAY_TEXT),
    [rule.inputs],
  );
  const initialActions = useMemo(
    () => pretty(rule.actions, EMPTY_ARRAY_TEXT),
    [rule.actions],
  );

  const [conditionsText, setConditionsText] = useState(initialConditions);
  const [inputsText, setInputsText] = useState(initialInputs);
  const [actionsText, setActionsText] = useState(initialActions);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<unknown | null>(null);

  const conditions = useMemo(
    () => parseConditions(conditionsText),
    [conditionsText],
  );
  const inputs = useMemo(
    () => parseObjectArray(inputsText, "Inputs"),
    [inputsText],
  );
  const actions = useMemo(
    () => parseObjectArray(actionsText, "Actions"),
    [actionsText],
  );

  const canEdit = rule.status === "draft";
  const allValid = conditions.ok && inputs.ok && actions.ok;

  const previewBody: RulePublishRequest | null = useMemo(() => {
    if (!conditions.ok || !inputs.ok || !actions.ok) return null;
    const body: RulePublishRequest = {
      conditionTree: conditions.value ?? {},
    };
    if (inputs.value && inputs.value.length > 0) {
      body.inputs = inputs.value as RulePublishRequest["inputs"];
    }
    if (actions.value && actions.value.length > 0) {
      body.actions = actions.value as RulePublishRequest["actions"];
    }
    const trimmedNotes = notes.trim();
    if (trimmedNotes.length > 0) {
      body.notes = trimmedNotes;
    }
    return body;
  }, [conditions, inputs, actions, notes]);

  async function handlePublish() {
    if (!previewBody) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const { data } = await api.violationRule.POST(
        "/rules/{ruleId}/publish",
        {
          params: {
            path: { ruleId: rule.ruleId },
            header: { "Idempotency-Key": crypto.randomUUID() },
          },
          body: previewBody,
        },
      );
      if (data) {
        onPublished(data as RuleDefinition);
      }
    } catch (caught) {
      setServerError(caught);
    } finally {
      setSubmitting(false);
    }
  }

  if (!canEdit) {
    return (
      <p className={styles.locked}>
        <StatusBadge>
          {rule.status === "published"
            ? "already published"
            : rule.status}
        </StatusBadge>
        <span>
          Editor is available only for draft rules. Create a new draft
          to make changes.
        </span>
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      {serverError ? <ApiErrorView error={serverError} /> : null}

      <Textarea
        id="rule-editor-conditions"
        label="Conditions (JSON object)"
        rows={6}
        value={conditionsText}
        onChange={(e) => setConditionsText(e.target.value)}
        invalid={!conditions.ok}
        hint={
          conditions.ok
            ? "Define when this rule should trigger."
            : conditions.message
        }
      />

      <Textarea
        id="rule-editor-inputs"
        label="Inputs (JSON array)"
        rows={5}
        value={inputsText}
        onChange={(e) => setInputsText(e.target.value)}
        invalid={!inputs.ok}
        hint={
          inputs.ok
            ? "Signals and channels the rule reads from."
            : inputs.message
        }
      />

      <Textarea
        id="rule-editor-actions"
        label="Actions (JSON array)"
        rows={5}
        value={actionsText}
        onChange={(e) => setActionsText(e.target.value)}
        invalid={!actions.ok}
        hint={
          actions.ok
            ? "What happens when the rule matches."
            : actions.message
        }
      />

      <Input
        id="rule-editor-notes"
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        hint="Short message for the change log."
      />

      <section
        className={styles.preview}
        aria-label="Payload preview"
      >
        <h5 className={styles.previewTitle}>Payload preview</h5>
        {previewBody ? (
          <pre className={styles.previewBody}>
            {JSON.stringify(previewBody, null, 2)}
          </pre>
        ) : (
          <p className={styles.previewEmpty}>
            Fix the highlighted fields to preview the payload.
          </p>
        )}
      </section>

      <div className={styles.footer}>
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!allValid || submitting}
          onClick={handlePublish}
        >
          {submitting ? "Publishing…" : "Publish version"}
        </Button>
      </div>
    </div>
  );
}
