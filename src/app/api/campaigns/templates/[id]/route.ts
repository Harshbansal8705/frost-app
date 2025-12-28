import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";
import { EmailLogStatus } from "@/generated/prisma/enums";
import { getNextScheduleTime } from "@/lib/utils";


export const DELETE = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const campaignTemplateId = (await params).id;

  const campaignTemplate = await prisma.campaignTemplate.findUnique({
    where: { id: campaignTemplateId },
    include: { campaign: { include: { user: true } } }
  });

  if (!campaignTemplate || campaignTemplate.campaign.user.email !== session.user.email) {
    throw new FrostError("Template step not found or unauthorized", 404);
  }

  const paramsCheck = await prisma.campaignTemplate.findFirst({
    where: { campaignId: campaignTemplate.campaignId },
    orderBy: { sequence: 'desc' }
  });

  if (paramsCheck && paramsCheck.id !== campaignTemplateId) {
    throw new FrostError("Can only remove the last step of the sequence", 400);
  }

  await prisma.emailLog.deleteMany({
    where: {
      campaignId: campaignTemplate.campaignId,
      sequence: campaignTemplate.sequence,
      status: EmailLogStatus.SCHEDULED
    }
  });

  await prisma.campaignTemplate.delete({
    where: { id: campaignTemplateId }
  });

  return new NextResponse(null, { status: 204 });
});

export const PATCH = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const campaignTemplateId = (await params).id;
  const body = await req.json();
  const { delay } = body;

  const campaignTemplate = await prisma.campaignTemplate.findUnique({
    where: { id: campaignTemplateId },
    include: { campaign: { include: { user: true } } }
  });

  if (!campaignTemplate || campaignTemplate.campaign.user.email !== session.user.email) {
    throw new FrostError("Template step not found or unauthorized", 404);
  }

  await prisma.campaignTemplate.update({
    where: { id: campaignTemplateId },
    data: { delay }
  });

  if (campaignTemplate.sequence === 1) return new NextResponse(null, { status: 204 });

  const { mailSendingTime, timezone, sendOnWeekends } = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
    select: { mailSendingTime: true, timezone: true, sendOnWeekends: true }
  }) || { mailSendingTime: "09:00", timezone: "Asia/Kolkata", sendOnWeekends: false };

  const pendingLogs = await prisma.emailLog.findMany({
    where: {
      campaignId: campaignTemplate.campaignId,
      sequence: campaignTemplate.sequence,
      status: EmailLogStatus.SCHEDULED
    },
    include: {
      contact: {
        select: {
          emailLogs: {
            where: {
              sequence: campaignTemplate.sequence - 1,
              status: EmailLogStatus.SENT
            },
            select: { sentAt: true }
          }
        }
      }
    }
  });

  const updateOperations = pendingLogs.map(log => {
    const prevLog = log.contact?.emailLogs[0];
    if (!prevLog?.sentAt) return null;

    const targetTime = getNextScheduleTime(mailSendingTime, timezone, sendOnWeekends, prevLog.sentAt, delay);

    return () => prisma.emailLog.update({
      where: { id: log.id },
      data: { scheduledAt: targetTime }
    });
  }).filter(Boolean) as (() => Promise<unknown>)[];

  // Process updates in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < updateOperations.length; i += BATCH_SIZE) {
    const batch = updateOperations.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(op => op()));
  }

  return new NextResponse(null, { status: 204 });
});
