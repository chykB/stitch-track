import type {
  AgreementResolution,
} from "../../agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../agreement/domain/agreement-version";

export type AgreementHistoryEntry =
  Readonly<{
    version: AgreementVersion;
    resolution:
      AgreementResolution | null;
  }>;

export function findHistoricalApprovedFittingBaseline(
  history:
    readonly AgreementHistoryEntry[],
  occurredAt: Date,
): AgreementVersion | null {
  if (
    !(occurredAt instanceof Date) ||
    Number.isNaN(
      occurredAt.getTime(),
    )
  ) {
    throw new Error(
      "Fitting occurrence time must be a valid date.",
    );
  }

  const eligible =
    history.filter(
      ({ version }) =>
        version.createdAt.getTime() <=
        occurredAt.getTime(),
    );

  if (eligible.length === 0) {
    return null;
  }

  const latest =
    eligible.reduce(
      (current, candidate) =>
        candidate.version
          .revisionNumber >
        current.version
          .revisionNumber
          ? candidate
          : current,
    );

  const resolution =
    latest.resolution;

  if (
    !resolution ||
    resolution.outcome !==
      "APPROVED" ||
    resolution.occurredAt.getTime() >
      occurredAt.getTime()
  ) {
    return null;
  }

  return latest.version;
}
