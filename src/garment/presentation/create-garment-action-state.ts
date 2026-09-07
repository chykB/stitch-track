export type GarmentFormIssue = Readonly<{
  path: string;
  message: string;
}>;

export type CreatedGarmentSummary =
  Readonly<{
    id: string;
    orderId: string;
    name: string;
  }>;

export type CreateGarmentActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues: readonly GarmentFormIssue[];
    garment: CreatedGarmentSummary | null;
  }>;
