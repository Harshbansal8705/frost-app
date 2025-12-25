-- DropForeignKey
ALTER TABLE "CampaignTemplate" DROP CONSTRAINT "CampaignTemplate_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "CampaignTemplate" DROP CONSTRAINT "CampaignTemplate_templateId_fkey";

-- AddForeignKey
ALTER TABLE "CampaignTemplate" ADD CONSTRAINT "CampaignTemplate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTemplate" ADD CONSTRAINT "CampaignTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
