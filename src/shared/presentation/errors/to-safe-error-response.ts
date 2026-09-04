import type {
  ApplicationLogger,
  LogContext,
} from "@/shared/application/logging/logger";
import {
  ApplicationError,
  type ApplicationErrorCode,
} from "@/shared/application/errors/application-error";
import { InputValidationError } from "@/shared/validation/input-validation-error";

export type SafeValidationIssue = Readonly<{
  path: string;
  code: string;
  message: string;
}>;

export type SafeErrorBody =
  | Readonly<{
      code: "INVALID_INPUT";
      message: string;
      issues: readonly SafeValidationIssue[];
    }>
  | Readonly<{
      code: ApplicationErrorCode;
      message: string;
    }>
  | Readonly<{
      code: "INTERNAL_ERROR";
      message: string;
    }>;

export type SafeErrorResponse = Readonly<{
  status: number;
  body: SafeErrorBody;
}>;

const APPLICATION_ERROR_STATUS: Readonly<
  Record<ApplicationErrorCode, number>
> = {
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

const APPLICATION_ERROR_MESSAGE: Readonly<
  Record<ApplicationErrorCode, string>
> = {
  NOT_FOUND: "The requested resource was not found.",
  CONFLICT: "The request conflicts with the current state.",
  UNAUTHORIZED: "Authentication is required.",
  FORBIDDEN: "You do not have permission to perform this action.",
};

export function toSafeErrorResponse(
  error: unknown,
  logger: ApplicationLogger,
  context?: LogContext,
): SafeErrorResponse {
  if (error instanceof InputValidationError) {
    return {
      status: 400,
      body: {
        code: "INVALID_INPUT",
        message: "The submitted input is invalid.",
        issues: error.issues,
      },
    };
  }

  if (error instanceof ApplicationError) {
    return {
      status: APPLICATION_ERROR_STATUS[error.code],
      body: {
        code: error.code,
        message: APPLICATION_ERROR_MESSAGE[error.code],
      },
    };
  }

  logger.error(
    "Unexpected boundary error.",
    error,
    context,
  );

  return {
    status: 500,
    body: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    },
  };
}
