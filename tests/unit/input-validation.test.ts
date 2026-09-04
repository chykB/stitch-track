import { describe, expect, it } from "vitest";
import { z } from "zod";

import { InputValidationError } from "@/shared/validation/input-validation-error";
import { parseInput } from "@/shared/validation/parse-input";

describe("parseInput", () => {
  const schema = z.object({
    name: z.string().trim().min(1),
    quantity: z.number().int().positive(),
  });

  it("returns validated and transformed input", () => {
    const result = parseInput(schema, {
      name: "  Sample  ",
      quantity: 2,
    });

    expect(result).toEqual({
      name: "Sample",
      quantity: 2,
    });
  });

  it("throws InputValidationError for invalid input", () => {
    expect(() =>
      parseInput(schema, {
        name: "",
        quantity: -1,
      }),
    ).toThrow(InputValidationError);
  });

  it("returns structured validation issues", () => {
    try {
      parseInput(schema, {
        name: "",
        quantity: -1,
      });

      throw new Error("Expected parseInput to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(InputValidationError);

      const validationError = error as InputValidationError;

      expect(validationError.code).toBe("INVALID_INPUT");
      expect(validationError.issues).toHaveLength(2);

      expect(validationError.issues.map((issue) => issue.path)).toEqual([
        "name",
        "quantity",
      ]);
    }
  });

  it("does not retain the raw input object", () => {
    const input = {
      name: "",
      quantity: -1,
      secret: "do-not-store-this",
    };

    try {
      parseInput(schema, input);

      throw new Error("Expected parseInput to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(InputValidationError);
      expect(JSON.stringify(error)).not.toContain(
        "do-not-store-this",
      );
    }
  });

  it("uses $ for root-level validation failures", () => {
    const rootSchema = z.string().min(1);

    try {
      parseInput(rootSchema, 123);

      throw new Error("Expected parseInput to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(InputValidationError);

      const validationError = error as InputValidationError;

      expect(validationError.issues[0]?.path).toBe("$");
    }
  });
});
