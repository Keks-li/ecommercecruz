-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SINGLE', 'COMBO');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'SINGLE';
