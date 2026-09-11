export type ChangeProposalFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type CreatedChangeProposalSummary =
  Readonly<{
    id: string;
    changeRequestId: string;
    revisionNumber: number;
    designSummary: string;
    priceAmount: string;
    currency: string;
    deliveryDate: string;
  }>;

export type CreateChangeProposalVersionActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly ChangeProposalFormIssue[];
    proposal:
      CreatedChangeProposalSummary | null;
  }>;
