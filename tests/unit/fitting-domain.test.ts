import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeDirectCompletedFittingSessionDetails,
  normalizeFittingOutcomeDetails,
  normalizeScheduledFittingSessionDetails,
} from "../../src/fitting/domain/fitting";

const NOW =
  new Date(
    "2026-09-12T12:00:00.000Z",
  );

describe("fitting domain", () => {
  it(
    "normalizes a future scheduled fitting",
    () => {
      const result =
        normalizeScheduledFittingSessionDetails({
          scheduledFor:
            new Date(
              "2026-09-13T10:00:00.000Z",
            ),
          note:
            "  First   fitting ",
          now: NOW,
        });

      expect(result).toEqual({
        scheduledFor:
          new Date(
            "2026-09-13T10:00:00.000Z",
          ),
        note:
          "First fitting",
      });
    },
  );

  it(
    "rejects a scheduled fitting that is not in the future",
    () => {
      expect(() =>
        normalizeScheduledFittingSessionDetails({
          scheduledFor: NOW,
          now: NOW,
        }),
      ).toThrow(
        "A scheduled fitting must be in the future.",
      );
    },
  );

  it(
    "supports a direct completed fitting session without a schedule",
    () => {
      expect(
        normalizeDirectCompletedFittingSessionDetails({
          note:
            "  Recorded later ",
        }),
      ).toEqual({
        scheduledFor: null,
        note:
          "Recorded later",
      });
    },
  );

  it(
    "normalizes completed fitting evidence",
    () => {
      expect(
        normalizeFittingOutcomeDetails({
          outcome:
            "COMPLETED",
          occurredAt:
            new Date(
              "2026-09-12T10:00:00.000Z",
            ),
          baselineAgreementVersionId:
            " agreement-1 ",
          resultingMeasurementVersionId:
            " measurement-2 ",
          observationSummary:
            "  Waist   adjusted ",
          now: NOW,
        }),
      ).toEqual({
        outcome:
          "COMPLETED",
        occurredAt:
          new Date(
            "2026-09-12T10:00:00.000Z",
          ),
        baselineAgreementVersionId:
          "agreement-1",
        resultingMeasurementVersionId:
          "measurement-2",
        observationSummary:
          "Waist adjusted",
        cancellationReason:
          null,
      });
    },
  );

  it(
    "rejects completed fitting without an approved baseline",
    () => {
      expect(() =>
        normalizeFittingOutcomeDetails({
          outcome:
            "COMPLETED",
          occurredAt:
            new Date(
              "2026-09-12T10:00:00.000Z",
            ),
          observationSummary:
            "Fit checked.",
          now: NOW,
        }),
      ).toThrow(
        "Completed fitting requires an approved agreement baseline.",
      );
    },
  );

  it(
    "requires an observation summary for a completed fitting",
    () => {
      expect(() =>
        normalizeFittingOutcomeDetails({
          outcome:
            "COMPLETED",
          occurredAt:
            new Date(
              "2026-09-12T10:00:00.000Z",
            ),
          baselineAgreementVersionId:
            "agreement-1",
          now: NOW,
        }),
      ).toThrow(
        "Completed fitting observation summary is required.",
      );
    },
  );

  it(
    "rejects a resulting measurement on a cancelled fitting",
    () => {
      expect(() =>
        normalizeFittingOutcomeDetails({
          outcome:
            "CANCELLED",
          occurredAt:
            new Date(
              "2026-09-12T10:00:00.000Z",
            ),
          resultingMeasurementVersionId:
            "measurement-2",
          cancellationReason:
            "Client unavailable.",
          now: NOW,
        }),
      ).toThrow(
        "Cancelled fitting cannot contain completion evidence.",
      );
    },
  );

  it(
    "rejects completion evidence on a cancelled fitting",
    () => {
      expect(() =>
        normalizeFittingOutcomeDetails({
          outcome:
            "CANCELLED",
          occurredAt:
            new Date(
              "2026-09-12T10:00:00.000Z",
            ),
          baselineAgreementVersionId:
            "agreement-1",
          cancellationReason:
            "Client unavailable.",
          now: NOW,
        }),
      ).toThrow(
        "Cancelled fitting cannot contain completion evidence.",
      );
    },
  );

  it(
    "requires a cancellation reason",
    () => {
      expect(() =>
        normalizeFittingOutcomeDetails({
          outcome:
            "CANCELLED",
          occurredAt:
            new Date(
              "2026-09-12T10:00:00.000Z",
            ),
          now: NOW,
        }),
      ).toThrow(
        "Cancelled fitting reason is required.",
      );
    },
  );

  it(
    "rejects a future fitting occurrence time",
    () => {
      expect(() =>
        normalizeFittingOutcomeDetails({
          outcome:
            "COMPLETED",
          occurredAt:
            new Date(
              "2026-09-12T13:00:00.000Z",
            ),
          baselineAgreementVersionId:
            "agreement-1",
          observationSummary:
            "Fit checked.",
          now: NOW,
        }),
      ).toThrow(
        "Fitting occurrence time cannot be in the future.",
      );
    },
  );
});
