export type StyleReferenceFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type CreatedStyleReferenceSummary =
  Readonly<{
    id: string;
    garmentId: string;
    sourceUrl: string;
    label: string | null;
  }>;

export type CreateStyleReferenceActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly StyleReferenceFormIssue[];
    styleReference:
      CreatedStyleReferenceSummary | null;
  }>;
