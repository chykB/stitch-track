export type ApplicationErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN";

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly isExpected = true;

  constructor(
    code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);

    this.name = "ApplicationError";
    this.code = code;
  }
}

export function isApplicationError(
  error: unknown,
): error is ApplicationError {
  return error instanceof ApplicationError;
}
