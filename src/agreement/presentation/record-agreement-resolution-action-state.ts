export type AgreementResolutionFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type RecordedAgreementResolutionSummary =
  Readonly<{
    id: string;
    agreementVersionId: string;
    outcome:
      | "APPROVED"
      | "REJECTED"
      | "WITHDRAWN";
    occurredAt: string;
  }>;

export type RecordAgreementResolutionActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly AgreementResolutionFormIssue[];
    resolution:
      RecordedAgreementResolutionSummary | null;
  }>;
