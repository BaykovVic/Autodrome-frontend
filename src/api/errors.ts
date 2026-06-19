// Canonical REST error envelope from
//   contracts/docs/common-dto-and-error-model.md
// section "4. Error envelope > REST".

export interface ErrorEnvelopeBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    correlationId?: string;
    timestamp?: string;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId?: string;
  readonly timestamp?: string;
  readonly details?: unknown;
  readonly url: string;

  constructor(init: {
    status: number;
    code: string;
    message: string;
    correlationId?: string;
    timestamp?: string;
    details?: unknown;
    url: string;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.correlationId = init.correlationId;
    this.timestamp = init.timestamp;
    this.details = init.details;
    this.url = init.url;
  }
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelopeBody {
  if (!value || typeof value !== "object") return false;
  const error = (value as { error?: unknown }).error;
  if (!error || typeof error !== "object") return false;
  const candidate = error as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}

export async function parseErrorResponse(
  response: Response,
  url: string,
): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    body = undefined;
  }

  if (isErrorEnvelope(body)) {
    const { error } = body;
    return new ApiError({
      status: response.status,
      code: error.code,
      message: error.message,
      correlationId: error.correlationId,
      timestamp: error.timestamp,
      details: error.details,
      url,
    });
  }

  return new ApiError({
    status: response.status,
    code: "HTTP_" + response.status,
    message:
      response.statusText ||
      `Request failed with status ${response.status}`,
    url,
  });
}
