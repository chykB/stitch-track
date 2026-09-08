/*
  Warnings:

  - A unique constraint covering the columns `[id,businessId]` on the table `business_member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,businessId,orderId]` on the table `garment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,businessId,clientId]` on the table `measurement_version` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,businessId,clientId]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,businessId,garmentId]` on the table `style_reference` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AgreementResolutionOutcome" AS ENUM ('APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ClientDecisionChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'PHONE', 'IN_PERSON', 'OTHER');

-- CreateTable
CREATE TABLE "agreement_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "garmentId" UUID NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "measurementVersionId" UUID,
    "designSummary" TEXT NOT NULL,
    "fabricDescription" TEXT,
    "quantity" INTEGER NOT NULL,
    "priceAmount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "deliveryDate" DATE NOT NULL,
    "note" TEXT,
    "supersedesAgreementVersionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_version_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agreement_version_revision_positive_check" CHECK ("revisionNumber" > 0),
    CONSTRAINT "agreement_version_quantity_positive_check" CHECK ("quantity" > 0),
    CONSTRAINT "agreement_version_price_positive_check" CHECK ("priceAmount" > 0),
    CONSTRAINT "agreement_version_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$')
);

-- CreateTable
CREATE TABLE "agreement_style_reference" (
    "businessId" UUID NOT NULL,
    "agreementVersionId" UUID NOT NULL,
    "styleReferenceId" UUID NOT NULL,
    "garmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_style_reference_pkey" PRIMARY KEY ("agreementVersionId","styleReferenceId")
);

-- CreateTable
CREATE TABLE "agreement_resolution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "agreementVersionId" UUID NOT NULL,
    "outcome" "AgreementResolutionOutcome" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "clientNameSnapshot" TEXT,
    "clientDecisionChannel" "ClientDecisionChannel",
    "evidenceNote" TEXT NOT NULL,
    "recordedByMembershipId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_resolution_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agreement_resolution_evidence_note_nonempty_check"
        CHECK ("evidenceNote" !~ '^[[:space:]]*$'),
    CONSTRAINT "agreement_resolution_client_evidence_check"
        CHECK (
            (
                "outcome" IN ('APPROVED', 'REJECTED')
                AND "clientNameSnapshot" IS NOT NULL
                AND "clientNameSnapshot" !~ '^[[:space:]]*$'
                AND "clientDecisionChannel" IS NOT NULL
            )
            OR
            (
                "outcome" = 'WITHDRAWN'
                AND "clientNameSnapshot" IS NULL
                AND "clientDecisionChannel" IS NULL
            )
        )
);

-- CreateIndex
CREATE INDEX "agreement_version_businessId_idx" ON "agreement_version"("businessId");

-- CreateIndex
CREATE INDEX "agreement_version_businessId_clientId_idx" ON "agreement_version"("businessId", "clientId");

-- CreateIndex
CREATE INDEX "agreement_version_businessId_orderId_idx" ON "agreement_version"("businessId", "orderId");

-- CreateIndex
-- CreateIndex
CREATE UNIQUE INDEX "agreement_version_id_business_uidx" ON "agreement_version"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_version_id_business_garment_uidx" ON "agreement_version"("id", "businessId", "garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_version_business_garment_revision_uidx" ON "agreement_version"("businessId", "garmentId", "revisionNumber");

-- CreateIndex
CREATE INDEX "agreement_style_reference_businessId_idx" ON "agreement_style_reference"("businessId");

-- CreateIndex
CREATE INDEX "agreement_style_reference_businessId_garmentId_idx" ON "agreement_style_reference"("businessId", "garmentId");

-- CreateIndex
CREATE INDEX "agreement_style_reference_businessId_agreementVersionId_idx" ON "agreement_style_reference"("businessId", "agreementVersionId");

-- CreateIndex
CREATE INDEX "agreement_resolution_businessId_idx" ON "agreement_resolution"("businessId");

-- CreateIndex
CREATE INDEX "agreement_resolution_businessId_recordedByMembershipId_idx" ON "agreement_resolution"("businessId", "recordedByMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_resolution_version_business_uidx" ON "agreement_resolution"("agreementVersionId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "business_member_id_businessId_uidx" ON "business_member"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "garment_id_business_order_uidx" ON "garment"("id", "businessId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_version_id_business_client_uidx" ON "measurement_version"("id", "businessId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "order_id_business_client_uidx" ON "order"("id", "businessId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "style_reference_id_business_garment_uidx" ON "style_reference"("id", "businessId", "garmentId");

-- AddForeignKey
ALTER TABLE "agreement_version" ADD CONSTRAINT "agreement_version_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_version" ADD CONSTRAINT "agreement_version_client_chain_fkey" FOREIGN KEY ("clientId", "businessId") REFERENCES "client"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_version" ADD CONSTRAINT "agreement_version_order_chain_fkey" FOREIGN KEY ("orderId", "businessId", "clientId") REFERENCES "order"("id", "businessId", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_version" ADD CONSTRAINT "agreement_version_garment_chain_fkey" FOREIGN KEY ("garmentId", "businessId", "orderId") REFERENCES "garment"("id", "businessId", "orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_version" ADD CONSTRAINT "agreement_version_measurement_chain_fkey" FOREIGN KEY ("measurementVersionId", "businessId", "clientId") REFERENCES "measurement_version"("id", "businessId", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_version" ADD CONSTRAINT "agreement_version_supersedes_fkey" FOREIGN KEY ("supersedesAgreementVersionId", "businessId", "garmentId") REFERENCES "agreement_version"("id", "businessId", "garmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_style_reference" ADD CONSTRAINT "agreement_style_reference_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_style_reference" ADD CONSTRAINT "agreement_style_reference_version_fkey" FOREIGN KEY ("agreementVersionId", "businessId", "garmentId") REFERENCES "agreement_version"("id", "businessId", "garmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_style_reference" ADD CONSTRAINT "agreement_style_reference_style_fkey" FOREIGN KEY ("styleReferenceId", "businessId", "garmentId") REFERENCES "style_reference"("id", "businessId", "garmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_style_reference" ADD CONSTRAINT "agreement_style_reference_garment_fkey" FOREIGN KEY ("garmentId", "businessId") REFERENCES "garment"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_resolution" ADD CONSTRAINT "agreement_resolution_business_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_resolution" ADD CONSTRAINT "agreement_resolution_version_fkey" FOREIGN KEY ("agreementVersionId", "businessId") REFERENCES "agreement_version"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_resolution" ADD CONSTRAINT "agreement_resolution_membership_fkey" FOREIGN KEY ("recordedByMembershipId", "businessId") REFERENCES "business_member"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;
