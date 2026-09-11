import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeChangeRequestDetails,
} from "../../src/change-control/domain/change-request";

const BASELINE_TIME =
  new Date(
    "2026-09-09T10:00:00.000Z",
  );

const REQUEST_TIME =
  new Date(
    "2026-09-09T11:00:00.000Z",
  );

const NOW =
  new Date(
    "2026-09-09T12:00:00.000Z",
  );

describe(
  "change request domain",
  () => {
    it(
      "normalizes a Business-recorded client request",
      () => {
        expect(
          normalizeChangeRequestDetails({
            requestedBy:
              "CLIENT",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              "WHATSAPP",
            description:
              "  Add   long sleeves ",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toEqual({
          requestedBy:
            "CLIENT",
          origin:
            "BUSINESS_RECORDED",
          requestChannel:
            "WHATSAPP",
          description:
            "Add long sleeves",
          requestedAt:
            REQUEST_TIME,
        });
      },
    );

    it(
      "allows the Business to initiate a change without a client channel",
      () => {
        expect(
          normalizeChangeRequestDetails({
            requestedBy:
              "BUSINESS",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              null,
            description:
              "Correct construction detail",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }).requestChannel,
        ).toBeNull();
      },
    );

    it(
      "accepts a client portal request only through the PORTAL channel",
      () => {
        expect(
          normalizeChangeRequestDetails({
            requestedBy:
              "CLIENT",
            origin:
              "CLIENT_PORTAL",
            requestChannel:
              "PORTAL",
            description:
              "Change neckline",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toMatchObject({
          requestedBy:
            "CLIENT",
          origin:
            "CLIENT_PORTAL",
          requestChannel:
            "PORTAL",
        });
      },
    );

    it(
      "rejects a portal request attributed to the Business",
      () => {
        expect(() =>
          normalizeChangeRequestDetails({
            requestedBy:
              "BUSINESS",
            origin:
              "CLIENT_PORTAL",
            requestChannel:
              "PORTAL",
            description:
              "Change neckline",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toThrow(
          "portal change request must be requested by the client",
        );
      },
    );

    it(
      "rejects PORTAL as the channel for a Business-recorded client request",
      () => {
        expect(() =>
          normalizeChangeRequestDetails({
            requestedBy:
              "CLIENT",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              "PORTAL",
            description:
              "Change neckline",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toThrow(
          "requires a client communication channel",
        );
      },
    );

    it(
      "requires a communication channel for a Business-recorded client request",
      () => {
        expect(() =>
          normalizeChangeRequestDetails({
            requestedBy:
              "CLIENT",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              null,
            description:
              "Change neckline",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toThrow(
          "requires a client communication channel",
        );
      },
    );

    it(
      "rejects a client channel for a Business-requested change",
      () => {
        expect(() =>
          normalizeChangeRequestDetails({
            requestedBy:
              "BUSINESS",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              "EMAIL",
            description:
              "Correct construction detail",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toThrow(
          "does not use a client communication channel",
        );
      },
    );

    it(
      "rejects a request before the approved baseline",
      () => {
        expect(() =>
          normalizeChangeRequestDetails({
            requestedBy:
              "CLIENT",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              "PHONE",
            description:
              "Change neckline",
            requestedAt:
              new Date(
                "2026-09-09T09:59:59.999Z",
              ),
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toThrow(
          "cannot be before the approved baseline",
        );
      },
    );

    it(
      "rejects a request in the future",
      () => {
        expect(() =>
          normalizeChangeRequestDetails({
            requestedBy:
              "CLIENT",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              "EMAIL",
            description:
              "Change neckline",
            requestedAt:
              new Date(
                "2026-09-09T12:00:00.001Z",
              ),
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toThrow(
          "cannot be in the future",
        );
      },
    );

    it(
      "requires a nonblank request description",
      () => {
        expect(() =>
          normalizeChangeRequestDetails({
            requestedBy:
              "CLIENT",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              "EMAIL",
            description:
              "   ",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toThrow(
          "Change request description is required",
        );
      },
    );

    it(
      "rejects an invalid request channel",
      () => {
        expect(() =>
          normalizeChangeRequestDetails({
            requestedBy:
              "CLIENT",
            origin:
              "BUSINESS_RECORDED",
            requestChannel:
              "SMS",
            description:
              "Change neckline",
            requestedAt:
              REQUEST_TIME,
            baselineResolutionOccurredAt:
              BASELINE_TIME,
            now:
              NOW,
          }),
        ).toThrow(
          "Change request channel is invalid",
        );
      },
    );
  },
);
