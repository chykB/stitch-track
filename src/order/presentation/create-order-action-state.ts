export type OrderFormIssue = Readonly<{
  path: string;
  message: string;
}>;

export type CreatedOrderSummary =
  Readonly<{
    id: string;
    clientId: string;
  }>;

export type CreateOrderActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues: readonly OrderFormIssue[];
    order: CreatedOrderSummary | null;
  }>;
