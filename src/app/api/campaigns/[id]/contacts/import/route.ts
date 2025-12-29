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

  const user = session.user;

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

  const validLeads = leads.filter((l) => l.email && l.name && l.company) as { email: string; name: string; company: string }[];
  if (validLeads.length === 0) return NextResponse.json({ count: 0 });

  // 1. Handle Companies - Bulk ensure companies exist
  const companyNames = [...new Set(validLeads.map((l) => l.company))];

  // Find existing companies
  const existingCompanies = await prisma.company.findMany({
    where: {
      userId: user.id,
      name: { in: companyNames }
    }
  });

  const fst = getFirstScheduleTime(mailSendingTime, timezone, sendOnWeekends);
  const existingNames = new Set(existingCompanies.map(c => c.name));
  const missingNames = companyNames.filter(name => !existingNames.has(name));

  const createdCount = await prisma.$transaction(async (tx) => {
    // Create missing companies
    if (missingNames.length > 0) {
      await tx.company.createMany({
        data: missingNames.map(name => ({
          name,
          userId: user.id
        })),
        skipDuplicates: true
      });
    }

    // Fetch all companies to ensure we have all IDs (even if some were created in parallel)
    const allCompanies = await tx.company.findMany({
      where: {
        userId: user.id,
        name: { in: companyNames }
      }
    });

    const companyMap = new Map(allCompanies.map(c => [c.name, c.id]));

    // 2. Prepare and Create Contacts
    const contactData = validLeads.map((lead) => ({
      email: lead.email,
      name: lead.name,
      companyId: companyMap.get(lead.company)!,
      userId: user.id,
      campaignId: campaignId,
      status: Status.ACTIVE
    }));

    const newContacts = await tx.contact.createManyAndReturn({
      data: contactData
    });

    // 3. Schedule Emails
    if (firstStep && campaign.status === CampaignStatus.ACTIVE && newContacts.length > 0) {
      const emailLogData = newContacts.map(contact => ({
        campaignId,
        templateId: firstStep.templateId,
        contactId: contact.id,
        sequence: 1,
        status: EmailLogStatus.SCHEDULED,
        scheduledAt: fst
      }));

      await tx.emailLog.createMany({
        data: emailLogData
      });
    }

    return newContacts.length;
  });

  return NextResponse.json({ count: createdCount });
});
