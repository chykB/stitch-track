import type {
  PortalFormIssue,
} from "./portal-action-error";

export type PortalCreateChangeRequestActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly PortalFormIssue[];
    submitted: boolean;
  }>;
