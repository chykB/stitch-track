import pino, {
  type DestinationStream,
  type Logger as PinoLogger,
} from "pino";

import type {
  ApplicationLogger,
  LogContext,
} from "@/shared/application/logging/logger";

const REDACTED_VALUE = "[REDACTED]";

const REDACT_PATHS = [
  "context.password",
  "context.token",
  "context.accessToken",
  "context.refreshToken",
  "context.authorization",
  "context.cookie",
  "context.apiKey",
  "context.secret",
  "context.headers.authorization",
  "context.headers.cookie",
  "context.credentials.password",
  "context.credentials.token",
  "context.credentials.accessToken",
  "context.credentials.refreshToken",
] as const;

type SafeErrorDetails = Readonly<{
  name: string;
  message?: string;
  stack?: string;
}>;

export type CreatePinoLoggerOptions = Readonly<{
  level?: string;
  destination?: DestinationStream;
}>;

function toSafeErrorDetails(
  error: unknown,
): SafeErrorDetails | undefined {
  if (error === undefined) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
  };
}

export class PinoApplicationLogger
  implements ApplicationLogger
{
  constructor(
    private readonly logger: PinoLogger,
  ) {}

  debug(
    message: string,
    context?: LogContext,
  ): void {
    this.logger.debug(
      context ? { context } : {},
      message,
    );
  }

  info(
    message: string,
    context?: LogContext,
  ): void {
    this.logger.info(
      context ? { context } : {},
      message,
    );
  }

  warn(
    message: string,
    context?: LogContext,
  ): void {
    this.logger.warn(
      context ? { context } : {},
      message,
    );
  }

  error(
    message: string,
    error?: unknown,
    context?: LogContext,
  ): void {
    const errorDetails = toSafeErrorDetails(error);

    this.logger.error(
      {
        ...(context ? { context } : {}),
        ...(errorDetails ? { error: errorDetails } : {}),
      },
      message,
    );
  }
}

export function createPinoApplicationLogger(
  options: CreatePinoLoggerOptions = {},
): ApplicationLogger {
  const logger = pino(
    {
      level:
        options.level ??
        process.env.LOG_LEVEL ??
        "info",

      redact: {
        paths: [...REDACT_PATHS],
        censor: REDACTED_VALUE,
      },
    },
    options.destination,
  );

  return new PinoApplicationLogger(logger);
}
