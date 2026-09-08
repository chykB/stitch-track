export type MeasurementFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type CreatedMeasurementVersionSummary =
  Readonly<{
    id: string;
    clientId: string;
    measuredAt: string;
    unit:
      | "CENTIMETER"
      | "INCH";
    entryCount: number;
  }>;

export type CreateMeasurementVersionActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly MeasurementFormIssue[];
    measurementVersion:
      CreatedMeasurementVersionSummary | null;
  }>;
