export type LogContext = Readonly<Record<string, unknown>>;

export interface ApplicationLogger {
  debug(message: string, context?: LogContext): void;

  info(message: string, context?: LogContext): void;

  warn(message: string, context?: LogContext): void;

  error(
    message: string,
    error?: unknown,
    context?: LogContext,
  ): void;
}
