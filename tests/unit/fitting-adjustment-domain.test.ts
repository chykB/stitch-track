import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeFittingAdjustmentDescription,
  normalizeFittingAdjustmentResolutionDetails,
} from "../../src/fitting/domain/fitting-adjustment";

const NOW =
  new Date(
    "2026-09-12T12:00:00.000Z",
  );

describe(
  "fitting adjustment domain",
  () => {
    it(
      "normalizes an adjustment description",
      () => {
        expect(
          normalizeFittingAdjustmentDescription(
            "  Take   in waist ",
          ),
        ).toBe(
          "Take in waist",
        );
      },
    );

    it(
      "rejects a blank adjustment description",
      () => {
        expect(() =>
          normalizeFittingAdjustmentDescription(
            "   ",
          ),
        ).toThrow(
          "Fitting adjustment description is required.",
        );
      },
    );
  },
);

describe(
  "fitting adjustment resolution domain",
  () => {
    it(
      "normalizes a completed adjustment",
      () => {
        expect(
          normalizeFittingAdjustmentResolutionDetails({
            outcome:
              "COMPLETED",
            occurredAt:
              new Date(
                "2026-09-12T10:00:00.000Z",
              ),
            note:
              "  Finished   after fitting ",
            now: NOW,
          }),
        ).toEqual({
          outcome:
            "COMPLETED",
          occurredAt:
            new Date(
              "2026-09-12T10:00:00.000Z",
            ),
          note:
            "Finished after fitting",
          reason: null,
        });
      },
    );

    it(
      "normalizes a voided adjustment",
      () => {
        expect(
          normalizeFittingAdjustmentResolutionDetails({
            outcome:
              "VOIDED",
            occurredAt:
              new Date(
                "2026-09-12T10:00:00.000Z",
              ),
            reason:
              "  No longer   required ",
            now: NOW,
          }),
        ).toEqual({
          outcome:
            "VOIDED",
          occurredAt:
            new Date(
              "2026-09-12T10:00:00.000Z",
            ),
          note: null,
          reason:
            "No longer required",
        });
      },
    );

    it(
      "requires a reason when voided",
      () => {
        expect(() =>
          normalizeFittingAdjustmentResolutionDetails({
            outcome:
              "VOIDED",
            occurredAt:
              new Date(
                "2026-09-12T10:00:00.000Z",
              ),
            now: NOW,
          }),
        ).toThrow(
          "Voided adjustment reason is required.",
        );
      },
    );

    it(
      "rejects a void reason on a completed adjustment",
      () => {
        expect(() =>
          normalizeFittingAdjustmentResolutionDetails({
            outcome:
              "COMPLETED",
            occurredAt:
              new Date(
                "2026-09-12T10:00:00.000Z",
              ),
            reason:
              "Not needed",
            now: NOW,
          }),
        ).toThrow(
          "Completed adjustment cannot contain a void reason.",
        );
      },
    );

    it(
      "rejects a future resolution time",
      () => {
        expect(() =>
          normalizeFittingAdjustmentResolutionDetails({
            outcome:
              "COMPLETED",
            occurredAt:
              new Date(
                "2026-09-12T13:00:00.000Z",
              ),
            now: NOW,
          }),
        ).toThrow(
          "Adjustment resolution time cannot be in the future.",
        );
      },
    );

    it(
      "rejects an invalid resolution outcome",
      () => {
        expect(() =>
          normalizeFittingAdjustmentResolutionDetails({
            outcome:
              "REJECTED",
            occurredAt:
              new Date(
                "2026-09-12T10:00:00.000Z",
              ),
            now: NOW,
          }),
        ).toThrow(
          "Fitting adjustment resolution outcome is invalid.",
        );
      },
    );
  },
);
