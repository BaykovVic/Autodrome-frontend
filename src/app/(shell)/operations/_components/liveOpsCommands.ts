/**
 * Live operations commands против
 * `deployment-operations-service`:
 *   - `POST /ops/diagnostics` → diagnostic bundle.
 *   - `POST /ops/backup` → backup job.
 *   - `POST /ops/restore` → restore job (destructive,
 *     требует confirmedBy when dryRun=false).
 *
 * Все commands несут IdempotencyKey header (canonical
 * requirement). Errors bubbles up as `ApiError`.
 */

import { newCorrelationId } from "@/api/correlation";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/deployment-operations";

type DiagnosticsRequestDto =
  components["schemas"]["DiagnosticsRequest"];
type DiagnosticBundleDto =
  components["schemas"]["DiagnosticBundle"];
type BackupRequestDto = components["schemas"]["BackupRequest"];
type BackupJobDto = components["schemas"]["BackupJob"];
type RestoreRequestDto = components["schemas"]["RestoreRequest"];
type RestoreJobDto = components["schemas"]["RestoreJob"];

function idempotencyKey(): string {
  return newCorrelationId();
}

export async function liveOpsCreateDiagnostics(
  adapter: AutodromeApi,
  body: DiagnosticsRequestDto,
): Promise<DiagnosticBundleDto> {
  const result = await adapter.deploymentOperations.POST(
    "/ops/diagnostics",
    {
      body,
      params: {
        header: {
          "Idempotency-Key": idempotencyKey(),
        },
      },
    },
  );
  const data = result.data as DiagnosticBundleDto | undefined;
  if (!data) {
    throw new Error("Diagnostics endpoint returned no body.");
  }
  return data;
}

export async function liveOpsStartBackup(
  adapter: AutodromeApi,
  body: BackupRequestDto,
): Promise<BackupJobDto> {
  const result = await adapter.deploymentOperations.POST(
    "/ops/backup",
    {
      body,
      params: {
        header: {
          "Idempotency-Key": idempotencyKey(),
        },
      },
    },
  );
  const data = result.data as BackupJobDto | undefined;
  if (!data) {
    throw new Error("Backup endpoint returned no body.");
  }
  return data;
}

export async function liveOpsStartRestore(
  adapter: AutodromeApi,
  body: RestoreRequestDto,
): Promise<RestoreJobDto> {
  if (!body.dryRun && (!body.confirmedBy || body.confirmedBy.length === 0)) {
    throw new Error(
      "Restore requires `confirmedBy` when dryRun is false (destructive operation).",
    );
  }
  const result = await adapter.deploymentOperations.POST(
    "/ops/restore",
    {
      body,
      params: {
        header: {
          "Idempotency-Key": idempotencyKey(),
        },
      },
    },
  );
  const data = result.data as RestoreJobDto | undefined;
  if (!data) {
    throw new Error("Restore endpoint returned no body.");
  }
  return data;
}
