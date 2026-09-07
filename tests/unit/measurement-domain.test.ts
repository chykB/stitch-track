import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeMeasurementEntry,
  normalizeMeasurementValue,
  normalizeMeasurementVersionDetails,
} from "@/measurement/domain/measurement";

describe("measurement domain", () => {
  it("normalizes a measurement version without losing decimal precision", () => {
    const measuredAt =
      new Date(
        "2026-09-07T10:00:00.000Z",
      );

    const result =
      normalizeMeasurementVersionDetails({
        measuredAt,
        unit: "CENTIMETER",
        note:
          "  Taken before cutting  ",
        entries: [
          {
            label:
              "  Sleeve   length ",
            value: "0032.500",
          },
          {
            label: "Waist",
            value: "30.2500",
          },
        ],
      });

    expect(result).toEqual({
      measuredAt,
      unit: "CENTIMETER",
      note: "Taken before cutting",
      entries: [
        {
          label: "Sleeve length",
          normalizedKey:
            "sleeve length",
          value: "32.5",
        },
        {
          label: "Waist",
          normalizedKey: "waist",
          value: "30.25",
        },
      ],
    });
  });

  it("supports inches as a version-wide unit", () => {
    const result =
      normalizeMeasurementVersionDetails({
        measuredAt: new Date(),
        unit: "INCH",
        entries: [
          {
            label: "Waist",
            value: "32",
          },
        ],
      });

    expect(result.unit).toBe("INCH");
  });

  it("turns a blank note into null", () => {
    const result =
      normalizeMeasurementVersionDetails({
        measuredAt: new Date(),
        unit: "CENTIMETER",
        note: "   ",
        entries: [
          {
            label: "Bust",
            value: "90",
          },
        ],
      });

    expect(result.note).toBeNull();
  });

  it("rejects an empty measurement version", () => {
    expect(() =>
      normalizeMeasurementVersionDetails({
        measuredAt: new Date(),
        unit: "CENTIMETER",
        entries: [],
      }),
    ).toThrow(
      "At least one measurement is required.",
    );
  });

  it("rejects duplicate normalized labels within one version", () => {
    expect(() =>
      normalizeMeasurementVersionDetails({
        measuredAt: new Date(),
        unit: "CENTIMETER",
        entries: [
          {
            label: "Waist",
            value: "80",
          },
          {
            label: " waist ",
            value: "81",
          },
        ],
      }),
    ).toThrow(
      "Measurement labels must be unique within a version.",
    );
  });

  it.each([
    "0",
    "0.000",
    "-1",
    "1e2",
    ".5",
    "12.",
    "abc",
  ])(
    "rejects invalid or non-positive value %s",
    (value) => {
      expect(() =>
        normalizeMeasurementValue(
          value,
        ),
      ).toThrow();
    },
  );

  it("rejects an empty label", () => {
    expect(() =>
      normalizeMeasurementEntry({
        label: "   ",
        value: "10",
      }),
    ).toThrow(
      "Measurement label is required.",
    );
  });

  it("rejects an unsupported unit", () => {
    expect(() =>
      normalizeMeasurementVersionDetails({
        measuredAt: new Date(),
        unit: "MILLIMETER",
        entries: [
          {
            label: "Waist",
            value: "80",
          },
        ],
      }),
    ).toThrow(
      "Measurement unit is invalid.",
    );
  });

  it("rejects an invalid measurement date", () => {
    expect(() =>
      normalizeMeasurementVersionDetails({
        measuredAt:
          new Date("invalid"),
        unit: "CENTIMETER",
        entries: [
          {
            label: "Waist",
            value: "80",
          },
        ],
      }),
    ).toThrow(
      "Measurement date is invalid.",
    );
  });
});
