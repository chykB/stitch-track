export type AgreementVersionFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type CreatedAgreementVersionSummary =
  Readonly<{
    id: string;
    garmentId: string;
    revisionNumber: number;
    designSummary: string;
    priceAmount: string;
    currency: string;
    deliveryDate: string;
  }>;

export type CreateAgreementVersionActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly AgreementVersionFormIssue[];
    agreementVersion:
      CreatedAgreementVersionSummary | null;
  }>;
