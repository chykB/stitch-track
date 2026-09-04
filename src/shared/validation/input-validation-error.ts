export type ValidationIssue = Readonly<{
  path: string;
  code: string;
  message: string;
}>;

export class InputValidationError extends Error {
  readonly code = "INVALID_INPUT";
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super("Input validation failed.");

    this.name = "InputValidationError";
    this.issues = issues;
  }
}
