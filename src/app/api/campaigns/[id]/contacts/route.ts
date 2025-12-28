import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";
import { CampaignStatus, EmailLogStatus, Status } from "@/generated/prisma/enums";
import { getFirstScheduleTime } from "@/lib/utils";


export const POST = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const campaignId = (await params).id;
  const body = await req.json();
  const { email, name, companyName } = body;

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

  if (!companyName) throw new FrostError("Company name is required", 400);

  // Find or create company
  let companyId = "";

  const company = await prisma.company.findFirst({
    where: { userId: user.id, name: companyName }
  });

  if (!company) {
    companyId = await prisma.company.create({
      data: {
        name: companyName,
        userId: user.id
      }
    }).then((company) => company.id);
  } else {
    companyId = company.id;
  }

  const newContact = await prisma.contact.create({
    data: {
      email,
      name: name || "",
      userId: user.id,
      campaignId: campaignId,
      companyId: companyId,
      status: Status.ACTIVE
    }
  });

  // Get User Preferences
  const { mailSendingTime, timezone, sendOnWeekends } = await prisma.preferences.findUnique({
    where: { userId: user.id },
    select: { mailSendingTime: true, timezone: true, sendOnWeekends: true }
  }) || { mailSendingTime: "09:00", timezone: "Asia/Kolkata", sendOnWeekends: false };

  // Only schedule the first mail (Sequence 1)
  const firstStep = await prisma.campaignTemplate.findFirst({
    where: { campaignId, sequence: 1 }
  });

  if (firstStep && campaign.status === CampaignStatus.ACTIVE) {
    await prisma.emailLog.create({
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

  return NextResponse.json(newContact);
});
