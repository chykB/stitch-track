"use server";

import { z } from "zod";

import {
  createMeasurementVersionForCurrentTenant,
} from "../../composition/create-measurement-version";
import type {
  CreateMeasurementVersionActionState,
} from "../create-measurement-version-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const measurementEntrySchema =
  z.object({
    label:
      z.string()
        .trim()
        .min(
          1,
          "Measurement name is required.",
        )
        .max(
          120,
          "Measurement name is too long.",
        ),

    value:
      z.string()
        .trim()
        .min(
          1,
          "Measurement value is required.",
        )
        .max(
          66,
          "Measurement value is too long.",
        )
        .regex(
          /^\d+(?:\.\d+)?$/,
          "Enter a positive decimal measurement.",
        )
        .refine(
          (value) =>
            value.replace(
              /[.0]/g,
              "",
            ).length > 0,
          "Measurement value must be greater than zero.",
        )
        .refine(
          (value) => {
            const [
              wholePart,
              fractionalPart,
            ] = value.split(".");

            const normalizedWhole =
              wholePart.replace(
                /^0+(?=\d)/,
                "",
              );

            const normalizedFraction =
              fractionalPart?.replace(
                /0+$/,
                "",
              );

            return (
              normalizedWhole.length <= 35 &&
              (normalizedFraction?.length ?? 0) <= 30
            );
          },
          "Measurement value exceeds supported precision.",
        ),
  });

const createMeasurementVersionSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    clientId:
      z.string().uuid(
        "Invalid client identifier.",
      ),

    measuredAt:
      z.string()
        .trim()
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          "Enter a valid measurement date.",
        )
        .refine(
          (value) => {
            const parsedDate =
              new Date(
                `${value}T00:00:00.000Z`,
              );

            return (
              !Number.isNaN(
                parsedDate.getTime(),
              ) &&
              parsedDate
                .toISOString()
                .slice(0, 10) ===
                value
            );
          },
          "Enter a valid measurement date.",
        )
        .transform(
          (value) =>
            new Date(
              `${value}T00:00:00.000Z`,
            ),
        ),

    unit:
      z.string()
        .refine(
          (value) =>
            value === "CENTIMETER" ||
            value === "INCH",
          "Select a valid measurement unit.",
        ),

    note:
      z.preprocess(
        (value) =>
          typeof value === "string" &&
          value.trim() === ""
            ? null
            : value,
        z.union([
          z.string()
            .trim()
            .max(
              2000,
              "Measurement note is too long.",
            ),
          z.null(),
        ]),
      ),

    entries:
      z.array(
        measurementEntrySchema,
      )
        .min(
          1,
          "Add at least one measurement.",
        ),
  }).superRefine(
    (input, context) => {
      const seen =
        new Set<string>();

      input.entries.forEach(
        (entry, index) => {
          const normalizedKey =
            entry.label
              .trim()
              .replace(
                /\s+/g,
                " ",
              )
              .toLowerCase();

          if (
            seen.has(
              normalizedKey,
            )
          ) {
            context.addIssue({
              code:
                "custom",
              path: [
                "entries",
                index,
                "label",
              ],
              message:
                "Measurement names must be unique.",
            });
          }

          seen.add(
            normalizedKey,
          );
        },
      );
    },
  );

export async function createMeasurementVersionAction(
  businessId: string,
  clientId: string,
  _previousState:
    CreateMeasurementVersionActionState,
  formData: FormData,
): Promise<CreateMeasurementVersionActionState> {
  void _previousState;

  try {
    const labels =
      formData.getAll(
        "measurementLabel",
      );

    const values =
      formData.getAll(
        "measurementValue",
      );

    const entryCount =
      Math.max(
        labels.length,
        values.length,
      );

    const entries =
      Array.from(
        {
          length:
            entryCount,
        },
        (_, index) => ({
          label:
            labels[index],
          value:
            values[index],
        }),
      );

    const input =
      parseInput(
        createMeasurementVersionSchema,
        {
          businessId,
          clientId,
          measuredAt:
            formData.get(
              "measuredAt",
            ),
          unit:
            formData.get(
              "unit",
            ),
          note:
            formData.get(
              "note",
            ),
          entries,
        },
      );

    const measurementVersion =
      await createMeasurementVersionForCurrentTenant(
        input.businessId,
        {
          clientId:
            input.clientId,
          measuredAt:
            input.measuredAt,
          unit:
            input.unit,
          note:
            input.note,
          entries:
            input.entries,
        },
      );

    return {
      status: "success",
      message:
        "Measurements recorded successfully.",
      issues: [],
      measurementVersion: {
        id:
          measurementVersion.id,
        clientId:
          measurementVersion.clientId,
        measuredAt:
          measurementVersion
            .measuredAt
            .toISOString(),
        unit:
          measurementVersion.unit,
        entryCount:
          measurementVersion
            .entries.length,
      },
    };
  } catch (error) {
    const response =
      toSafeErrorResponse(
        error,
        applicationLogger,
        {
          operation:
            "create-measurement-version",
        },
      );

    return {
      status: "error",
      message:
        response.body.message,
      issues:
        response.body.code ===
        "INVALID_INPUT"
          ? response.body.issues.map(
              (issue) => ({
                path:
                  issue.path,
                message:
                  issue.message,
              }),
            )
          : [],
      measurementVersion:
        null,
    };
  }
}
