import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeChangeProposalDecisionDetails,
} from "../../src/change-control/domain/change-proposal-decision";

const PROPOSAL_CREATED_AT =
  new Date(
    "2026-09-09T12:00:00.000Z",
  );

const DECISION_TIME =
  new Date(
    "2026-09-09T13:00:00.000Z",
  );

const NOW =
  new Date(
    "2026-09-09T14:00:00.000Z",
  );

describe(
  "change proposal decision domain",
  () => {
    it(
      "normalizes a Business-recorded approval",
      () => {
        expect(
          normalizeChangeProposalDecisionDetails({
            outcome:
              "APPROVED",
            occurredAt:
              DECISION_TIME,
            clientNameSnapshot:
              "  Ada   Okafor ",
            decisionSource:
              "BUSINESS_RECORDED",
            clientDecisionChannel:
              "whatsapp",
            evidenceNote:
              " Client approved   via WhatsApp. ",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toEqual({
          outcome:
            "APPROVED",
          occurredAt:
            DECISION_TIME,
          clientNameSnapshot:
            "Ada Okafor",
          decisionSource:
            "BUSINESS_RECORDED",
          clientDecisionChannel:
            "WHATSAPP",
          evidenceNote:
            "Client approved via WhatsApp.",
        });
      },
    );

    it(
      "normalizes a client portal rejection",
      () => {
        expect(
          normalizeChangeProposalDecisionDetails({
            outcome:
              "REJECTED",
            occurredAt:
              DECISION_TIME,
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "CLIENT_PORTAL",
            clientDecisionChannel:
              "PORTAL",
            evidenceNote:
              "Rejected through secure portal.",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toMatchObject({
          outcome:
            "REJECTED",
          decisionSource:
            "CLIENT_PORTAL",
          clientDecisionChannel:
            "PORTAL",
        });
      },
    );

    it(
      "rejects PORTAL for a Business-recorded decision",
      () => {
        expect(() =>
          normalizeChangeProposalDecisionDetails({
            outcome:
              "APPROVED",
            occurredAt:
              DECISION_TIME,
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "BUSINESS_RECORDED",
            clientDecisionChannel:
              "PORTAL",
            evidenceNote:
              "Approved.",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "Business-recorded decision cannot use the PORTAL channel",
        );
      },
    );

    it(
      "requires PORTAL for a client portal decision",
      () => {
        expect(() =>
          normalizeChangeProposalDecisionDetails({
            outcome:
              "APPROVED",
            occurredAt:
              DECISION_TIME,
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "CLIENT_PORTAL",
            clientDecisionChannel:
              "EMAIL",
            evidenceNote:
              "Approved.",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "client portal decision must use the PORTAL channel",
        );
      },
    );

    it(
      "rejects a decision before the proposal was created",
      () => {
        expect(() =>
          normalizeChangeProposalDecisionDetails({
            outcome:
              "REJECTED",
            occurredAt:
              new Date(
                "2026-09-09T11:59:59.999Z",
              ),
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "BUSINESS_RECORDED",
            clientDecisionChannel:
              "PHONE",
            evidenceNote:
              "Client rejected.",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "cannot be before the proposal was created",
        );
      },
    );

    it(
      "rejects a decision in the future",
      () => {
        expect(() =>
          normalizeChangeProposalDecisionDetails({
            outcome:
              "APPROVED",
            occurredAt:
              new Date(
                "2026-09-09T14:00:00.001Z",
              ),
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "BUSINESS_RECORDED",
            clientDecisionChannel:
              "EMAIL",
            evidenceNote:
              "Approved.",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "cannot be in the future",
        );
      },
    );

    it(
      "requires a client-name snapshot",
      () => {
        expect(() =>
          normalizeChangeProposalDecisionDetails({
            outcome:
              "APPROVED",
            occurredAt:
              DECISION_TIME,
            clientNameSnapshot:
              "   ",
            decisionSource:
              "BUSINESS_RECORDED",
            clientDecisionChannel:
              "EMAIL",
            evidenceNote:
              "Approved.",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "Client name snapshot is required",
        );
      },
    );

    it(
      "requires decision evidence",
      () => {
        expect(() =>
          normalizeChangeProposalDecisionDetails({
            outcome:
              "REJECTED",
            occurredAt:
              DECISION_TIME,
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "BUSINESS_RECORDED",
            clientDecisionChannel:
              "PHONE",
            evidenceNote:
              "   ",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "Decision evidence note is required",
        );
      },
    );

    it(
      "rejects unsupported decision outcomes",
      () => {
        expect(() =>
          normalizeChangeProposalDecisionDetails({
            outcome:
              "WITHDRAWN",
            occurredAt:
              DECISION_TIME,
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "BUSINESS_RECORDED",
            clientDecisionChannel:
              "PHONE",
            evidenceNote:
              "Recorded.",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "decision outcome is invalid",
        );
      },
    );

    it(
      "rejects an invalid decision source",
      () => {
        expect(() =>
          normalizeChangeProposalDecisionDetails({
            outcome:
              "APPROVED",
            occurredAt:
              DECISION_TIME,
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "SYSTEM",
            clientDecisionChannel:
              "PHONE",
            evidenceNote:
              "Recorded.",
            proposalCreatedAt:
              PROPOSAL_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "decision source is invalid",
        );
      },
    );
  },
);
