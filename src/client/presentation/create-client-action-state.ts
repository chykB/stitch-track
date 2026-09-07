export type ClientFormIssue = Readonly<{
  path: string;
  message: string;
}>;

export type CreatedClientSummary =
  Readonly<{
    id: string;
    name: string;
  }>;

export type CreateClientActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues: readonly ClientFormIssue[];
    client: CreatedClientSummary | null;
  }>;
