"use client";

import { useState } from "react";

import type { AutodromeApi } from "@/api/adapter";
import {
  ApiErrorView,
  Button,
  Input,
  StatusBadge,
} from "@/components";
import type { components } from "@/contracts/types/violation-rule";
import type { RuleDefinition } from "./useRulesData";
import styles from "./RulePublishForm.module.css";

type RulePublishRequest = components["schemas"]["RulePublishRequest"];

type Props = {
  api: AutodromeApi;
  rule: RuleDefinition;
  onPublished: (next: RuleDefinition) => void;
};

export function RulePublishForm({ api, rule, onPublished }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const canPublish = rule.status === "draft";

  async function callPublish() {
    setSubmitting(true);
    setError(null);
    try {
      // Visual condition editor is intentionally out of scope. Publish
      // sends an empty conditionTree placeholder; backend (and mock)
      // accept the canonical contract shape.
      const body: RulePublishRequest = { conditionTree: {} };
      if (notes.trim()) body.notes = notes.trim();
      const { data } = await api.violationRule.POST(
        "/rules/{ruleId}/publish",
        {
          params: {
            path: { ruleId: rule.ruleId },
            header: { "Idempotency-Key": crypto.randomUUID() },
          },
          body,
        },
      );
      if (data) {
        onPublished(data as RuleDefinition);
        setOpen(false);
        setNotes("");
      }
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  }

  if (!canPublish) {
    return (
      <p className={styles.locked}>
        <StatusBadge>
          {rule.status === "published"
            ? "already published"
            : rule.status}
        </StatusBadge>
        <span>Publish action is available only for draft rules.</span>
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      {error ? <ApiErrorView error={error} /> : null}
      {!open ? (
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={() => setOpen(true)}
        >
          Publish…
        </Button>
      ) : (
        <div className={styles.subForm}>
          <p className={styles.note}>
            Publishing sends a contract-shaped
            <span className={styles.mono}> RulePublishRequest</span>
            {" "}with an empty
            <span className={styles.mono}> conditionTree</span>. Visual
            condition editor and rule evaluation are intentionally out of
            scope for this baseline.
          </p>
          <Input
            id="rule-publish-notes"
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className={styles.footer}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setOpen(false);
                setNotes("");
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={submitting}
              onClick={callPublish}
            >
              {submitting ? "Publishing…" : "Submit publish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
