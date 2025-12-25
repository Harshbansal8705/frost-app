-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'DRAFT', 'PAUSED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "EmailLog" ADD COLUMN     "messageId" TEXT;
