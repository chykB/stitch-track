"use server";

import { z } from "zod";

import {
  createAgreementVersionForCurrentTenant,
} from "../../composition/create-agreement-version";
import type {
  CreateAgreementVersionActionState,
} from "../create-agreement-version-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const optionalTextSchema =
  z.preprocess(
    (value) =>
      typeof value === "string" &&
      value.trim() === ""
        ? null
        : value,
    z.union([
      z.string().trim(),
      z.null(),
    ]),
  );

const optionalUuidSchema =
  z.preprocess(
    (value) =>
      typeof value === "string" &&
      value.trim() === ""
        ? null
        : value,
    z.union([
      z.string().uuid(
        "Invalid measurement version identifier.",
      ),
      z.null(),
    ]),
  );

const quantitySchema =
  z.string()
    .trim()
    .regex(
      /^\d+$/,
      "Quantity must be a positive whole number.",
    )
    .transform(
      (value) =>
        Number(value),
    )
    .refine(
      (value) =>
        Number.isSafeInteger(
          value,
        ) &&
        value > 0,
      "Quantity must be a positive whole number.",
    );

const priceAmountSchema =
  z.string()
    .trim()
    .regex(
      /^\d+(?:\.\d+)?$/,
      "Price must be a positive decimal amount.",
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
          normalizedWhole.length <= 15 &&
          (normalizedFraction?.length ??
            0) <= 4
        );
      },
      "Price exceeds supported precision.",
    )
    .refine(
      (value) => {
        const normalized =
          value
            .replace(
              /^0+(?=\d)/,
              "",
            )
            .replace(
              /\.0+$/,
              "",
            );

        return (
          normalized !==
          "0"
        );
      },
      "Price must be greater than zero.",
    );

const deliveryDateSchema =
  z.string()
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Enter a valid delivery date.",
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
      "Enter a valid delivery date.",
    );

const createAgreementVersionSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    garmentId:
      z.string().uuid(
        "Invalid garment identifier.",
      ),

    measurementVersionId:
      optionalUuidSchema,

    designSummary:
      z.string()
        .trim()
        .min(
          1,
          "Design summary is required.",
        ),

    fabricDescription:
      optionalTextSchema,

    quantity:
      quantitySchema,

    priceAmount:
      priceAmountSchema,

    currency:
      z.string()
        .trim()
        .transform(
          (value) =>
            value.toUpperCase(),
        )
        .pipe(
          z.string().regex(
            /^[A-Z]{3}$/,
            "Currency must use a three-letter code.",
          ),
        ),

    deliveryDate:
      deliveryDateSchema,

    note:
      optionalTextSchema,

    styleReferenceIds:
      z.array(
        z.string().uuid(
          "Invalid style reference identifier.",
        ),
      ),
  }).superRefine(
    (input, context) => {
      const uniqueIds =
        new Set(
          input.styleReferenceIds,
        );

      if (
        uniqueIds.size !==
        input.styleReferenceIds
          .length
      ) {
        context.addIssue({
          code: "custom",
          path: [
            "styleReferenceIds",
          ],
          message:
            "Style references must be unique.",
        });
      }
    },
  );

export async function createAgreementVersionAction(
  businessId: string,
  garmentId: string,
  _previousState:
    CreateAgreementVersionActionState,
  formData: FormData,
): Promise<CreateAgreementVersionActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        createAgreementVersionSchema,
        {
          businessId,
          garmentId,
          measurementVersionId:
            formData.get(
              "measurementVersionId",
            ),
          designSummary:
            formData.get(
              "designSummary",
            ),
          fabricDescription:
            formData.get(
              "fabricDescription",
            ),
          quantity:
            formData.get(
              "quantity",
            ),
          priceAmount:
            formData.get(
              "priceAmount",
            ),
          currency:
            formData.get(
              "currency",
            ),
          deliveryDate:
            formData.get(
              "deliveryDate",
            ),
          note:
            formData.get(
              "note",
            ),
          styleReferenceIds:
            formData.getAll(
              "styleReferenceId",
            ),
        },
      );

    const agreementVersion =
      await createAgreementVersionForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          measurementVersionId:
            input
              .measurementVersionId,
          designSummary:
            input.designSummary,
          fabricDescription:
            input
              .fabricDescription,
          quantity:
            input.quantity,
          priceAmount:
            input.priceAmount,
          currency:
            input.currency,
          deliveryDate:
            input.deliveryDate,
          note:
            input.note,
          styleReferenceIds:
            input.styleReferenceIds,
        },
      );

    return {
      status: "success",
      message:
        "Agreement version created successfully.",
      issues: [],
      agreementVersion: {
        id:
          agreementVersion.id,
        garmentId:
          agreementVersion.garmentId,
        revisionNumber:
          agreementVersion
            .revisionNumber,
        designSummary:
          agreementVersion
            .designSummary,
        priceAmount:
          agreementVersion
            .priceAmount,
        currency:
          agreementVersion.currency,
        deliveryDate:
          agreementVersion
            .deliveryDate,
      },
    };
  } catch (error) {
    const response =
      toSafeErrorResponse(
        error,
        applicationLogger,
        {
          operation:
            "create-agreement-version",
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
      agreementVersion:
        null,
    };
  }
}
