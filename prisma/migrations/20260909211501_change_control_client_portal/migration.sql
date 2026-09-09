-- CreateEnum
CREATE TYPE "ChangeRequestedBy" AS ENUM ('CLIENT', 'BUSINESS');

-- CreateEnum
CREATE TYPE "ChangeRequestOrigin" AS ENUM ('BUSINESS_RECORDED', 'CLIENT_PORTAL');

-- CreateEnum
CREATE TYPE "ChangeProposalDecisionOutcome" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ChangeProposalDecisionSource" AS ENUM ('BUSINESS_RECORDED', 'CLIENT_PORTAL');

-- CreateEnum
CREATE TYPE "ChangeRequestClosureOutcome" AS ENUM ('WITHDRAWN', 'IMPOSSIBLE');

-- CreateEnum
CREATE TYPE "ClientPortalGrantPurpose" AS ENUM ('REQUEST_CHANGE', 'DECIDE_CHANGE_PROPOSAL');

-- AlterEnum
ALTER TYPE "ClientDecisionChannel" ADD VALUE 'PORTAL';

-- CreateTable
CREATE TABLE "change_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "garmentId" UUID NOT NULL,
    "baselineAgreementVersionId" UUID NOT NULL,
    "requestedBy" "ChangeRequestedBy" NOT NULL,
    "origin" "ChangeRequestOrigin" NOT NULL,
    "requestChannel" "ClientDecisionChannel",
    "description" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "recordedByMembershipId" UUID,
    "activeSlot" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_proposal_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "changeRequestId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "garmentId" UUID NOT NULL,
    "baselineAgreementVersionId" UUID NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "supersedesChangeProposalVersionId" UUID,
    "measurementVersionId" UUID,
    "designSummary" TEXT NOT NULL,
    "fabricDescription" TEXT,
    "quantity" INTEGER NOT NULL,
    "priceAmount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "deliveryDate" DATE NOT NULL,
    "note" TEXT,
    "rationale" TEXT NOT NULL,
    "createdByMembershipId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_proposal_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_proposal_style_reference" (
    "businessId" UUID NOT NULL,
    "changeProposalVersionId" UUID NOT NULL,
    "styleReferenceId" UUID NOT NULL,
    "garmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_proposal_style_reference_pkey" PRIMARY KEY ("changeProposalVersionId","styleReferenceId")
);

-- CreateTable
CREATE TABLE "change_proposal_decision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "changeProposalVersionId" UUID NOT NULL,
    "outcome" "ChangeProposalDecisionOutcome" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "clientNameSnapshot" TEXT NOT NULL,
    "decisionSource" "ChangeProposalDecisionSource" NOT NULL,
    "clientDecisionChannel" "ClientDecisionChannel" NOT NULL,
    "evidenceNote" TEXT NOT NULL,
    "recordedByMembershipId" UUID,
    "portalGrantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_proposal_decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_request_closure" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "changeRequestId" UUID NOT NULL,
    "outcome" "ChangeRequestClosureOutcome" NOT NULL,
    "reason" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "recordedByMembershipId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_request_closure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_portal_grant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "garmentId" UUID NOT NULL,
    "changeProposalVersionId" UUID,
    "purpose" "ClientPortalGrantPurpose" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdByMembershipId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_portal_grant_pkey" PRIMARY KEY ("id")
);

-- Domain integrity checks not expressible in Prisma schema.

-- ChangeRequest
ALTER TABLE "change_request"
    ADD CONSTRAINT "change_request_description_nonempty_check"
        CHECK ("description" !~ '^[[:space:]]*$'),
    ADD CONSTRAINT "change_request_active_slot_check"
        CHECK (
            "activeSlot" IS NULL
            OR "activeSlot" = 'ACTIVE'
        ),
    ADD CONSTRAINT "change_request_provenance_check"
        CHECK (
            (
                "origin" = 'CLIENT_PORTAL'
                AND "requestedBy" = 'CLIENT'
                AND "requestChannel"::text = 'PORTAL'
                AND "recordedByMembershipId" IS NULL
            )
            OR
            (
                "origin" = 'BUSINESS_RECORDED'
                AND "recordedByMembershipId" IS NOT NULL
                AND (
                    (
                        "requestedBy" = 'BUSINESS'
                        AND "requestChannel" IS NULL
                    )
                    OR
                    (
                        "requestedBy" = 'CLIENT'
                        AND "requestChannel" IS NOT NULL
                        AND "requestChannel"::text <> 'PORTAL'
                    )
                )
            )
        );

-- ChangeProposalVersion
ALTER TABLE "change_proposal_version"
    ADD CONSTRAINT "change_proposal_version_revision_positive_check"
        CHECK ("revisionNumber" > 0),
    ADD CONSTRAINT "change_proposal_version_revision_chain_check"
        CHECK (
            (
                "revisionNumber" = 1
                AND "supersedesChangeProposalVersionId" IS NULL
            )
            OR
            (
                "revisionNumber" > 1
                AND "supersedesChangeProposalVersionId" IS NOT NULL
            )
        ),
    ADD CONSTRAINT "change_proposal_version_no_self_supersession_check"
        CHECK (
            "supersedesChangeProposalVersionId" IS NULL
            OR "supersedesChangeProposalVersionId" <> "id"
        ),
    ADD CONSTRAINT "change_proposal_version_design_nonempty_check"
        CHECK ("designSummary" !~ '^[[:space:]]*$'),
    ADD CONSTRAINT "change_proposal_version_quantity_positive_check"
        CHECK ("quantity" > 0),
    ADD CONSTRAINT "change_proposal_version_price_positive_check"
        CHECK ("priceAmount" > 0),
    ADD CONSTRAINT "change_proposal_version_currency_format_check"
        CHECK ("currency" ~ '^[A-Z]{3}$'),
    ADD CONSTRAINT "change_proposal_version_rationale_nonempty_check"
        CHECK ("rationale" !~ '^[[:space:]]*$');

-- ChangeProposalDecision
ALTER TABLE "change_proposal_decision"
    ADD CONSTRAINT "change_proposal_decision_client_name_nonempty_check"
        CHECK ("clientNameSnapshot" !~ '^[[:space:]]*$'),
    ADD CONSTRAINT "change_proposal_decision_evidence_nonempty_check"
        CHECK ("evidenceNote" !~ '^[[:space:]]*$'),
    ADD CONSTRAINT "change_proposal_decision_provenance_check"
        CHECK (
            (
                "decisionSource" = 'BUSINESS_RECORDED'
                AND "recordedByMembershipId" IS NOT NULL
                AND "portalGrantId" IS NULL
                AND "clientDecisionChannel"::text <> 'PORTAL'
            )
            OR
            (
                "decisionSource" = 'CLIENT_PORTAL'
                AND "recordedByMembershipId" IS NULL
                AND "portalGrantId" IS NOT NULL
                AND "clientDecisionChannel"::text = 'PORTAL'
            )
        );

-- ChangeRequestClosure
ALTER TABLE "change_request_closure"
    ADD CONSTRAINT "change_request_closure_reason_nonempty_check"
        CHECK ("reason" !~ '^[[:space:]]*$');

-- ClientPortalGrant
ALTER TABLE "client_portal_grant"
    ADD CONSTRAINT "client_portal_grant_token_hash_nonempty_check"
        CHECK ("tokenHash" !~ '^[[:space:]]*$'),
    ADD CONSTRAINT "client_portal_grant_purpose_target_check"
        CHECK (
            (
                "purpose" = 'REQUEST_CHANGE'
                AND "changeProposalVersionId" IS NULL
            )
            OR
            (
                "purpose" = 'DECIDE_CHANGE_PROPOSAL'
                AND "changeProposalVersionId" IS NOT NULL
            )
        ),
    ADD CONSTRAINT "client_portal_grant_expiry_check"
        CHECK ("expiresAt" > "createdAt"),
    ADD CONSTRAINT "client_portal_grant_consumed_time_check"
        CHECK (
            "consumedAt" IS NULL
            OR (
                "consumedAt" >= "createdAt"
                AND "consumedAt" <= "expiresAt"
            )
        ),
    ADD CONSTRAINT "client_portal_grant_revoked_time_check"
        CHECK (
            "revokedAt" IS NULL
            OR "revokedAt" >= "createdAt"
        ),
    ADD CONSTRAINT "client_portal_grant_terminal_state_check"
        CHECK (
            "consumedAt" IS NULL
            OR "revokedAt" IS NULL
        );

-- CreateIndex
CREATE INDEX "change_request_businessId_idx" ON "change_request"("businessId");

-- CreateIndex
CREATE INDEX "change_request_businessId_clientId_idx" ON "change_request"("businessId", "clientId");

-- CreateIndex
CREATE INDEX "change_request_businessId_orderId_idx" ON "change_request"("businessId", "orderId");

-- CreateIndex
CREATE INDEX "change_request_businessId_garmentId_requestedAt_idx" ON "change_request"("businessId", "garmentId", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "change_request_id_business_uidx" ON "change_request"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "change_request_id_business_garment_uidx" ON "change_request"("id", "businessId", "garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "change_request_full_chain_uidx" ON "change_request"("id", "businessId", "clientId", "orderId", "garmentId", "baselineAgreementVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "change_request_active_slot_uidx" ON "change_request"("businessId", "garmentId", "activeSlot");

-- CreateIndex
CREATE INDEX "change_proposal_version_businessId_idx" ON "change_proposal_version"("businessId");

-- CreateIndex
CREATE INDEX "change_proposal_version_businessId_garmentId_idx" ON "change_proposal_version"("businessId", "garmentId");

-- CreateIndex
CREATE INDEX "change_proposal_version_businessId_changeRequestId_idx" ON "change_proposal_version"("businessId", "changeRequestId");

-- CreateIndex
CREATE INDEX "change_proposal_version_businessId_clientId_idx" ON "change_proposal_version"("businessId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "change_proposal_version_id_business_uidx" ON "change_proposal_version"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "change_proposal_version_id_business_garment_uidx" ON "change_proposal_version"("id", "businessId", "garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "change_proposal_version_id_business_request_uidx" ON "change_proposal_version"("id", "businessId", "changeRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "change_proposal_version_grant_chain_uidx" ON "change_proposal_version"("id", "businessId", "clientId", "orderId", "garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "change_proposal_version_request_revision_uidx" ON "change_proposal_version"("businessId", "changeRequestId", "revisionNumber");

-- CreateIndex
CREATE INDEX "change_proposal_style_reference_businessId_idx" ON "change_proposal_style_reference"("businessId");

-- CreateIndex
CREATE INDEX "change_proposal_style_reference_businessId_garmentId_idx" ON "change_proposal_style_reference"("businessId", "garmentId");

-- CreateIndex
CREATE INDEX "change_proposal_style_reference_businessId_changeProposalVe_idx" ON "change_proposal_style_reference"("businessId", "changeProposalVersionId");

-- CreateIndex
CREATE INDEX "change_proposal_decision_businessId_idx" ON "change_proposal_decision"("businessId");

-- CreateIndex
CREATE INDEX "change_proposal_decision_businessId_recordedByMembershipId_idx" ON "change_proposal_decision"("businessId", "recordedByMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "change_proposal_decision_proposal_business_uidx" ON "change_proposal_decision"("changeProposalVersionId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "change_proposal_decision_grant_business_uidx" ON "change_proposal_decision"("portalGrantId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "change_proposal_decision_grant_proposal_uidx" ON "change_proposal_decision"("portalGrantId", "businessId", "changeProposalVersionId");

-- CreateIndex
CREATE INDEX "change_request_closure_businessId_idx" ON "change_request_closure"("businessId");

-- CreateIndex
CREATE INDEX "change_request_closure_businessId_recordedByMembershipId_idx" ON "change_request_closure"("businessId", "recordedByMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "change_request_closure_request_business_uidx" ON "change_request_closure"("changeRequestId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_grant_token_hash_uidx" ON "client_portal_grant"("tokenHash");

-- CreateIndex
CREATE INDEX "client_portal_grant_businessId_idx" ON "client_portal_grant"("businessId");

-- CreateIndex
CREATE INDEX "client_portal_grant_businessId_clientId_orderId_garmentId_p_idx" ON "client_portal_grant"("businessId", "clientId", "orderId", "garmentId", "purpose");

-- CreateIndex
CREATE INDEX "client_portal_grant_businessId_changeProposalVersionId_idx" ON "client_portal_grant"("businessId", "changeProposalVersionId");

-- CreateIndex
CREATE INDEX "client_portal_grant_businessId_expiresAt_idx" ON "client_portal_grant"("businessId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_grant_id_business_uidx" ON "client_portal_grant"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_grant_decision_chain_uidx" ON "client_portal_grant"("id", "businessId", "changeProposalVersionId");

-- AddForeignKey
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_client_chain_fkey" FOREIGN KEY ("clientId", "businessId") REFERENCES "client"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_order_chain_fkey" FOREIGN KEY ("orderId", "businessId", "clientId") REFERENCES "order"("id", "businessId", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_garment_chain_fkey" FOREIGN KEY ("garmentId", "businessId", "orderId") REFERENCES "garment"("id", "businessId", "orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_baseline_fkey" FOREIGN KEY ("baselineAgreementVersionId", "businessId", "garmentId") REFERENCES "agreement_version"("id", "businessId", "garmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_recorder_fkey" FOREIGN KEY ("recordedByMembershipId", "businessId") REFERENCES "business_member"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_request_fkey" FOREIGN KEY ("changeRequestId", "businessId", "clientId", "orderId", "garmentId", "baselineAgreementVersionId") REFERENCES "change_request"("id", "businessId", "clientId", "orderId", "garmentId", "baselineAgreementVersionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_client_fkey" FOREIGN KEY ("clientId", "businessId") REFERENCES "client"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_order_fkey" FOREIGN KEY ("orderId", "businessId", "clientId") REFERENCES "order"("id", "businessId", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_garment_fkey" FOREIGN KEY ("garmentId", "businessId", "orderId") REFERENCES "garment"("id", "businessId", "orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_baseline_fkey" FOREIGN KEY ("baselineAgreementVersionId", "businessId", "garmentId") REFERENCES "agreement_version"("id", "businessId", "garmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_measurement_fkey" FOREIGN KEY ("measurementVersionId", "businessId", "clientId") REFERENCES "measurement_version"("id", "businessId", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_creator_fkey" FOREIGN KEY ("createdByMembershipId", "businessId") REFERENCES "business_member"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_version" ADD CONSTRAINT "change_proposal_version_supersedes_fkey" FOREIGN KEY ("supersedesChangeProposalVersionId", "businessId", "changeRequestId") REFERENCES "change_proposal_version"("id", "businessId", "changeRequestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_style_reference" ADD CONSTRAINT "change_proposal_style_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_style_reference" ADD CONSTRAINT "change_proposal_style_proposal_fkey" FOREIGN KEY ("changeProposalVersionId", "businessId", "garmentId") REFERENCES "change_proposal_version"("id", "businessId", "garmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_style_reference" ADD CONSTRAINT "change_proposal_style_reference_fkey" FOREIGN KEY ("styleReferenceId", "businessId", "garmentId") REFERENCES "style_reference"("id", "businessId", "garmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_style_reference" ADD CONSTRAINT "change_proposal_style_garment_fkey" FOREIGN KEY ("garmentId", "businessId") REFERENCES "garment"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_decision" ADD CONSTRAINT "change_proposal_decision_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_decision" ADD CONSTRAINT "change_proposal_decision_proposal_fkey" FOREIGN KEY ("changeProposalVersionId", "businessId") REFERENCES "change_proposal_version"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_decision" ADD CONSTRAINT "change_proposal_decision_recorder_fkey" FOREIGN KEY ("recordedByMembershipId", "businessId") REFERENCES "business_member"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_proposal_decision" ADD CONSTRAINT "change_proposal_decision_grant_fkey" FOREIGN KEY ("portalGrantId", "businessId", "changeProposalVersionId") REFERENCES "client_portal_grant"("id", "businessId", "changeProposalVersionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_request_closure" ADD CONSTRAINT "change_request_closure_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_request_closure" ADD CONSTRAINT "change_request_closure_request_fkey" FOREIGN KEY ("changeRequestId", "businessId") REFERENCES "change_request"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_request_closure" ADD CONSTRAINT "change_request_closure_recorder_fkey" FOREIGN KEY ("recordedByMembershipId", "businessId") REFERENCES "business_member"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_grant" ADD CONSTRAINT "client_portal_grant_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_grant" ADD CONSTRAINT "client_portal_grant_client_fkey" FOREIGN KEY ("clientId", "businessId") REFERENCES "client"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_grant" ADD CONSTRAINT "client_portal_grant_order_fkey" FOREIGN KEY ("orderId", "businessId", "clientId") REFERENCES "order"("id", "businessId", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_grant" ADD CONSTRAINT "client_portal_grant_garment_fkey" FOREIGN KEY ("garmentId", "businessId", "orderId") REFERENCES "garment"("id", "businessId", "orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_grant" ADD CONSTRAINT "client_portal_grant_proposal_fkey" FOREIGN KEY ("changeProposalVersionId", "businessId", "clientId", "orderId", "garmentId") REFERENCES "change_proposal_version"("id", "businessId", "clientId", "orderId", "garmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_grant" ADD CONSTRAINT "client_portal_grant_creator_fkey" FOREIGN KEY ("createdByMembershipId", "businessId") REFERENCES "business_member"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;
