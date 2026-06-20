/**
 * Local frontend shape for the operator-facing diagnostics overview.
 *
 * The backend does not yet expose a single diagnostics endpoint; this
 * type lives next to the workspace until a canonical DTO is added to
 * the contracts. When that happens, replace the type with the
 * generated DTO and switch the loader to a typed adapter call.
 */
export type DiagnosticsInfo = {
  nodeId: string;
  build: {
    version: string;
    commit: string;
    builtAt: string;
  };
  runtime: {
    startedAt: string;
    uptimeSeconds: number;
  };
  storage: {
    diskTotalGb: number;
    diskUsedGb: number;
  };
  configRefreshedAt: string;
};

const DEFAULT_DIAGNOSTICS: DiagnosticsInfo = {
  nodeId: "local-node-01",
  build: {
    version: "0.7.0",
    commit: "00000000",
    builtAt: "2026-06-19T08:00:00Z",
  },
  runtime: {
    startedAt: "2026-06-19T08:00:00Z",
    uptimeSeconds: 3600 * 6,
  },
  storage: {
    diskTotalGb: 256,
    diskUsedGb: 84,
  },
  configRefreshedAt: "2026-06-19T10:00:00Z",
};

export function defaultDiagnostics(): DiagnosticsInfo {
  return DEFAULT_DIAGNOSTICS;
}
