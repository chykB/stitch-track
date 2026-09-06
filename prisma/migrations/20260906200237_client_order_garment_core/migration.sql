-- CreateTable
CREATE TABLE "client" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_businessId_idx" ON "client"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "client_id_businessId_uidx" ON "client"("id", "businessId");

-- CreateIndex
CREATE INDEX "order_businessId_idx" ON "order"("businessId");

-- CreateIndex
CREATE INDEX "order_businessId_clientId_idx" ON "order"("businessId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "order_id_businessId_uidx" ON "order"("id", "businessId");

-- CreateIndex
CREATE INDEX "garment_businessId_idx" ON "garment"("businessId");

-- CreateIndex
CREATE INDEX "garment_businessId_orderId_idx" ON "garment"("businessId", "orderId");

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_clientId_businessId_fkey" FOREIGN KEY ("clientId", "businessId") REFERENCES "client"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment" ADD CONSTRAINT "garment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment" ADD CONSTRAINT "garment_orderId_businessId_fkey" FOREIGN KEY ("orderId", "businessId") REFERENCES "order"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;
