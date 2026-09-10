export type CloseChangeRequestFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type ClosedChangeRequestSummary =
  Readonly<{
    id: string;
    changeRequestId: string;
    outcome:
      | "WITHDRAWN"
      | "IMPOSSIBLE";
    occurredAt: string;
  }>;

export type CloseChangeRequestActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly CloseChangeRequestFormIssue[];
    closure:
      ClosedChangeRequestSummary | null;
  }>;
