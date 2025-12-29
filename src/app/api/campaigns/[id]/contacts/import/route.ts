import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";
import { CampaignStatus, EmailLogStatus, Status } from "@/generated/prisma/enums";
import { getFirstScheduleTime } from "@/lib/utils";

export const POST = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const campaignId = (await params).id;
  const body = await req.json();
  const { leads } = body;

  if (!Array.isArray(leads) || leads.length === 0) {
    throw new FrostError("No leads provided", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new FrostError("User not found", 404);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.userId !== user.id) {
    throw new FrostError("Campaign not found", 404);
  }

  // Get preferences
  const { mailSendingTime, timezone, sendOnWeekends } = await prisma.preferences.findUnique({
    where: { userId: user.id },
    select: { mailSendingTime: true, timezone: true, sendOnWeekends: true }
  }) || { mailSendingTime: "09:00", timezone: "Asia/Kolkata", sendOnWeekends: false };

  // Get first step
  const firstStep = await prisma.campaignTemplate.findFirst({
    where: { campaignId, sequence: 1 }
  });

  const createdCount = await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const lead of leads) {
      if (!lead.email || !lead.name || !lead.company) continue;

      // Find or create company
      let companyId = "";
      const existingCompany = await tx.company.findFirst({
        where: { userId: user.id, name: lead.company }
      });

      if (!existingCompany) {
        const newCompany = await tx.company.create({
          data: {
            name: lead.company,
            userId: user.id
          }
        });
        companyId = newCompany.id;
      } else {
        companyId = existingCompany.id;
      }

      const newContact = await tx.contact.create({
        data: {
          email: lead.email,
          name: lead.name,
          userId: user.id,
          campaignId: campaignId,
          companyId: companyId,
          status: Status.ACTIVE
        }
      });
      count++;

      // Schedule if needed
      if (firstStep && campaign.status === CampaignStatus.ACTIVE) {
        await tx.emailLog.create({
          data: {
            campaignId,
            templateId: firstStep.templateId,
            contactId: newContact.id,
            sequence: 1,
            status: EmailLogStatus.SCHEDULED,
            scheduledAt: getFirstScheduleTime(mailSendingTime, timezone, sendOnWeekends)
          }
        });
      }
    }
    return count;
  });

  return NextResponse.json({ count: createdCount });
});
