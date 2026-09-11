import type {
  PortalFormIssue,
} from "./portal-action-error";

export type PortalChangeProposalDecisionActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly PortalFormIssue[];
    decision:
      | "APPROVED"
      | "REJECTED"
      | null;
  }>;
