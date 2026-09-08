import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeStyleReferenceDetails,
} from "@/style-reference/domain/style-reference";

describe("style reference domain", () => {
  it("normalizes a valid HTTPS style reference", () => {
    const result =
      normalizeStyleReferenceDetails({
        sourceUrl:
          "  https://example.com/styles/gown.jpg  ",
        label:
          "  Front inspiration  ",
        note:
          "  Use the neckline shape  ",
      });

    expect(result).toEqual({
      sourceUrl:
        "https://example.com/styles/gown.jpg",
      label: "Front inspiration",
      note: "Use the neckline shape",
    });
  });

  it("supports HTTP URLs", () => {
    const result =
      normalizeStyleReferenceDetails({
        sourceUrl:
          "http://example.com/reference.png",
      });

    expect(result.sourceUrl).toBe(
      "http://example.com/reference.png",
    );
  });

  it("turns blank optional text into null", () => {
    const result =
      normalizeStyleReferenceDetails({
        sourceUrl:
          "https://example.com/reference.jpg",
        label: "   ",
        note: "   ",
      });

    expect(result.label).toBeNull();
    expect(result.note).toBeNull();
  });

  it("rejects an empty URL", () => {
    expect(() =>
      normalizeStyleReferenceDetails({
        sourceUrl: "   ",
      }),
    ).toThrow(
      "Style reference URL is required.",
    );
  });

  it.each([
    "not-a-url",
    "example.com/image.jpg",
  ])(
    "rejects invalid URL %s",
    (sourceUrl) => {
      expect(() =>
        normalizeStyleReferenceDetails({
          sourceUrl,
        }),
      ).toThrow(
        "Style reference URL is invalid.",
      );
    },
  );

  it.each([
    "ftp://example.com/image.jpg",
    "file:///tmp/reference.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,abc",
  ])(
    "rejects unsupported URL scheme %s",
    (sourceUrl) => {
      expect(() =>
        normalizeStyleReferenceDetails({
          sourceUrl,
        }),
      ).toThrow(
        "Style reference URL must use HTTP or HTTPS.",
      );
    },
  );
});
