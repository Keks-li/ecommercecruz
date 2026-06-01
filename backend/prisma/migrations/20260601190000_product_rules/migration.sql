-- CreateTable
CREATE TABLE "ProductPaymentRule" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "deadline_days" INTEGER,
    "penalty_pct" DOUBLE PRECISION,
    "grace_period_days" INTEGER,
    "cancel_fee_pct" DOUBLE PRECISION,
    "enable_recurring" BOOLEAN,
    "penalty_frequency" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPaymentRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductPaymentRule_product_id_key" ON "ProductPaymentRule"("product_id");

-- AddForeignKey
ALTER TABLE "ProductPaymentRule" ADD CONSTRAINT "ProductPaymentRule_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
