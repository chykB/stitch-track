export type ChangeProposalDecisionFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type RecordedChangeProposalDecisionSummary =
  Readonly<{
    id: string;
    changeProposalVersionId:
      string;
    outcome:
      | "APPROVED"
      | "REJECTED";
    occurredAt: string;
    appliedAgreementVersionId:
      string | null;
  }>;

export type RecordChangeProposalDecisionActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly ChangeProposalDecisionFormIssue[];
    decision:
      RecordedChangeProposalDecisionSummary | null;
  }>;
