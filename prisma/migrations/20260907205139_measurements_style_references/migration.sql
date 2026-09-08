/*
  Warnings:

  - A unique constraint covering the columns `[id,businessId]` on the table `garment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('CENTIMETER', 'INCH');

-- CreateTable
CREATE TABLE "measurement_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "unit" "MeasurementUnit" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_entry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "measurementVersionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "normalizedKey" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_entry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "measurement_entry_value_positive_check" CHECK ("value" > 0)
);

-- CreateTable
CREATE TABLE "style_reference" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "garmentId" UUID NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "label" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "style_reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "measurement_version_businessId_idx" ON "measurement_version"("businessId");

-- CreateIndex
CREATE INDEX "measurement_version_businessId_clientId_measuredAt_idx" ON "measurement_version"("businessId", "clientId", "measuredAt");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_version_id_businessId_uidx" ON "measurement_version"("id", "businessId");

-- CreateIndex
CREATE INDEX "measurement_entry_businessId_idx" ON "measurement_entry"("businessId");

-- CreateIndex
CREATE INDEX "measurement_entry_businessId_measurementVersionId_idx" ON "measurement_entry"("businessId", "measurementVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_entry_version_normalizedKey_uidx" ON "measurement_entry"("measurementVersionId", "normalizedKey");

-- CreateIndex
CREATE INDEX "style_reference_businessId_idx" ON "style_reference"("businessId");

-- CreateIndex
CREATE INDEX "style_reference_businessId_garmentId_idx" ON "style_reference"("businessId", "garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "garment_id_businessId_uidx" ON "garment"("id", "businessId");

-- AddForeignKey
ALTER TABLE "measurement_version" ADD CONSTRAINT "measurement_version_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_version" ADD CONSTRAINT "measurement_version_clientId_businessId_fkey" FOREIGN KEY ("clientId", "businessId") REFERENCES "client"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_entry" ADD CONSTRAINT "measurement_entry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_entry" ADD CONSTRAINT "measurement_entry_measurementVersionId_businessId_fkey" FOREIGN KEY ("measurementVersionId", "businessId") REFERENCES "measurement_version"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_reference" ADD CONSTRAINT "style_reference_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_reference" ADD CONSTRAINT "style_reference_garmentId_businessId_fkey" FOREIGN KEY ("garmentId", "businessId") REFERENCES "garment"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;
