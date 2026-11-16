/**
 * Error type for the public API. Upstream Papermark imports this file but
 * does not publish it; this is an independent implementation for the
 * community edition.
 */
export const ERROR_CODES = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unprocessable_entity: 422,
  rate_limit_exceeded: 429,
  internal_server_error: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class PapermarkApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "PapermarkApiError";
    this.code = code;
    this.status = ERROR_CODES[code];
  }

  toJSON() {
    return { error: { code: this.code, message: this.message } };
  }
}
