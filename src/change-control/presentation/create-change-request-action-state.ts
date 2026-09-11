export type ChangeRequestFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type CreatedChangeRequestSummary =
  Readonly<{
    id: string;
    garmentId: string;
    requestedBy:
      | "CLIENT"
      | "BUSINESS";
    requestChannel:
      | "WHATSAPP"
      | "EMAIL"
      | "PHONE"
      | "IN_PERSON"
      | "OTHER"
      | null;
    description: string;
    requestedAt: string;
  }>;

export type CreateChangeRequestActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly ChangeRequestFormIssue[];
    changeRequest:
      CreatedChangeRequestSummary | null;
  }>;
