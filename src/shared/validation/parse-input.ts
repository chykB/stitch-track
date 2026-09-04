import type { ZodType } from "zod";

import {
  InputValidationError,
  type ValidationIssue,
} from "./input-validation-error";

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "$";
  }

  return path.map(String).join(".");
}

export function parseInput<Output>(
  schema: ZodType<Output>,
  input: unknown,
): Output {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: formatIssuePath(issue.path),
    code: issue.code,
    message: issue.message,
  }));

  throw new InputValidationError(issues);
}
