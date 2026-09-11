import type {
  ApplicationLogger,
  LogContext,
} from "../../shared/application/logging/logger";
import {
  ApplicationError,
} from "../../shared/application/errors/application-error";
import {
  toSafeErrorResponse,
} from "../../shared/presentation/errors/to-safe-error-response";

export type PortalFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type PortalActionError =
  Readonly<{
    message: string;
    issues:
      readonly PortalFormIssue[];
  }>;

const PORTAL_UNAVAILABLE_MESSAGE =
  "This portal link is unavailable.";

export function toPortalActionError(
  error: unknown,
  logger:
    ApplicationLogger,
  context?:
    LogContext,
): PortalActionError {
  if (
    error instanceof
      ApplicationError
  ) {
    return {
      message:
        PORTAL_UNAVAILABLE_MESSAGE,
      issues: [],
    };
  }

  const response =
    toSafeErrorResponse(
      error,
      logger,
      context,
    );

  return {
    message:
      response.body.message,
    issues:
      response.body.code ===
      "INVALID_INPUT"
        ? response.body.issues.map(
            (issue) => ({
              path:
                issue.path,
              message:
                issue.message,
            }),
          )
        : [],
  };
}
