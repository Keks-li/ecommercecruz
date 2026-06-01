-- DropForeignKey
ALTER TABLE "ProductPaymentRule" DROP CONSTRAINT IF EXISTS "ProductPaymentRule_product_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "ProductPaymentRule";

-- AlterTable
ALTER TABLE "PaymentRule" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Default Rule';
ALTER TABLE "PaymentRule" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRule_name_key" ON "PaymentRule"("name");

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "payment_rule_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_payment_rule_id_fkey" FOREIGN KEY ("payment_rule_id") REFERENCES "PaymentRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing default rule (ensure at least one default exists and has is_default = true)
UPDATE "PaymentRule" SET "is_default" = true WHERE id = (SELECT MIN(id) FROM "PaymentRule");

-- Seed default rule if table is empty
INSERT INTO "PaymentRule" ("name", "is_default", "default_deadline_days", "default_penalty_pct", "grace_period_days", "default_cancel_fee_pct", "enable_recurring", "penalty_frequency", "max_refund_days", "updated_at")
SELECT 'Default Rule', true, 14, 10, 3, 15, false, 'monthly', 30, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentRule");
