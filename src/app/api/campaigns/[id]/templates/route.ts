import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";
import { EmailLogStatus, Status } from "@/generated/prisma/enums";
import { getFirstScheduleTime, getNextScheduleTime } from "@/lib/utils";


export const POST = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const campaignId = (await params).id;
  const body = await req.json();
  const { templateId } = body;

  if (!templateId) throw new FrostError("Template ID is required", 400);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { user: true }
  });

  if (!campaign || campaign.user.email !== session.user.email) {
    throw new FrostError("Campaign not found", 404);
  }

  const maxSeq = await prisma.campaignTemplate.findFirst({
    where: { campaignId },
    orderBy: { sequence: 'desc' }
  });

  const nextSeq = (maxSeq?.sequence || 0) + 1;

  await prisma.campaignTemplate.create({
    data: {
      campaignId,
      templateId,
      sequence: nextSeq,
    }
  });

  // Get User Preferences
  const { mailSendingTime, timezone, sendOnWeekends } = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
    select: { mailSendingTime: true, timezone: true, sendOnWeekends: true }
  }) || { mailSendingTime: "09:00", timezone: "Asia/Kolkata", sendOnWeekends: false };

  if (nextSeq === 1) {
    const contacts = await prisma.contact.findMany({
      where: {
        campaignId,
        status: Status.ACTIVE
      }
    });

    // Filter out contacts who already have a log for Sequence 1
    const existingLogs = await prisma.emailLog.findMany({
      where: {
        campaignId,
        contactId: { in: contacts.map(c => c.id) }
      },
      select: { contactId: true }
    });

    const existingContactIds = new Set(existingLogs.map(l => l.contactId));
    const eligibleContacts = contacts.filter(c => !existingContactIds.has(c.id));

    if (eligibleContacts.length > 0) {
      await prisma.emailLog.createMany({
        data: eligibleContacts.map(contact => ({
          campaignId,
          templateId,
          contactId: contact.id,
          sequence: 1,
          status: EmailLogStatus.SCHEDULED,
          scheduledAt: getFirstScheduleTime(mailSendingTime, timezone, sendOnWeekends)
        }))
      });
    }
  } else {
    const validContacts = await prisma.contact.findMany({
      where: {
        campaignId,
        status: Status.ACTIVE,
        AND: [
          {
            emailLogs: {
              some: {
                sequence: nextSeq - 1,
                status: EmailLogStatus.SENT
              }
            }
          },
          {
            emailLogs: {
              none: {
                sequence: nextSeq
              }
            }
          }
        ]
      },
      include: {
        emailLogs: {
          where: {
            sequence: nextSeq - 1,
            status: EmailLogStatus.SENT
          },
          select: { sentAt: true }
        }
      }
    });

    const validContactIds: string[] = [];
    const scheduleMap: Record<string, Date> = {};

    const createdStep = await prisma.campaignTemplate.findFirst({
      where: { campaignId, sequence: nextSeq }
    });

    if (!createdStep) throw new FrostError("Some error occurred", 500);

    for (const contact of validContacts) {
      const previousLog = contact.emailLogs[0];
      if (!previousLog) continue;
      validContactIds.push(contact.id);
      scheduleMap[contact.id] = getNextScheduleTime(mailSendingTime, timezone, sendOnWeekends, previousLog.sentAt || new Date(), createdStep.delay);
    }

    if (validContactIds.length > 0) {
      const logsToCreate = validContactIds.map(cid => ({
        campaignId,
        templateId,
        contactId: cid,
        sequence: nextSeq,
        status: EmailLogStatus.SCHEDULED,
        scheduledAt: scheduleMap[cid]
      }));

      await prisma.emailLog.createMany({
        data: logsToCreate
      });
    }
  }

  return new NextResponse(null, { status: 204 });
});
