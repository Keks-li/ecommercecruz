-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "CancellationStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED');

-- AlterTable: add new columns to Order
ALTER TABLE "Order"
  ADD COLUMN "penalty_amount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "penalty_pct"         DOUBLE PRECISION,
  ADD COLUMN "penalty_applied"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "payment_status"      "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "payment_due_date"    TIMESTAMP(3),
  ADD COLUMN "cancellation_status" "CancellationStatus" NOT NULL DEFAULT 'NONE';

-- CreateTable: PaymentTransaction
CREATE TABLE "PaymentTransaction" (
  "id"             SERIAL NOT NULL,
  "order_id"       INTEGER NOT NULL,
  "amount"         DOUBLE PRECISION NOT NULL,
  "payment_method" TEXT NOT NULL DEFAULT 'MANUAL',
  "reference"      TEXT,
  "note"           TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CancellationRequest
CREATE TABLE "CancellationRequest" (
  "id"                   SERIAL NOT NULL,
  "order_id"             INTEGER NOT NULL,
  "requested_by"         INTEGER NOT NULL,
  "reason"               TEXT NOT NULL,
  "cancellation_fee_pct" DOUBLE PRECISION NOT NULL,
  "refund_amount"        DOUBLE PRECISION NOT NULL,
  "status"               "CancellationStatus" NOT NULL DEFAULT 'REQUESTED',
  "admin_note"           TEXT,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CancellationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentRule
CREATE TABLE "PaymentRule" (
  "id"                     SERIAL NOT NULL,
  "default_deadline_days"  INTEGER NOT NULL DEFAULT 14,
  "default_penalty_pct"    DOUBLE PRECISION NOT NULL DEFAULT 10,
  "grace_period_days"      INTEGER NOT NULL DEFAULT 3,
  "default_cancel_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 15,
  "enable_recurring"       BOOLEAN NOT NULL DEFAULT false,
  "penalty_frequency"      TEXT NOT NULL DEFAULT 'monthly',
  "max_refund_days"        INTEGER NOT NULL DEFAULT 30,
  "updated_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
  "id"         SERIAL NOT NULL,
  "user_id"    INTEGER,
  "action"     TEXT NOT NULL,
  "entity"     TEXT NOT NULL,
  "entity_id"  INTEGER,
  "old_value"  TEXT,
  "new_value"  TEXT,
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on CancellationRequest.order_id
ALTER TABLE "CancellationRequest" ADD CONSTRAINT "CancellationRequest_order_id_key" UNIQUE ("order_id");

-- AddForeignKey: PaymentTransaction → Order
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: CancellationRequest → Order
ALTER TABLE "CancellationRequest" ADD CONSTRAINT "CancellationRequest_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the singleton PaymentRule row
INSERT INTO "PaymentRule"
  ("default_deadline_days","default_penalty_pct","grace_period_days","default_cancel_fee_pct","enable_recurring","penalty_frequency","max_refund_days","updated_at")
VALUES
  (14, 10, 3, 15, false, 'monthly', 30, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
