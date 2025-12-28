import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";
import { CampaignStatus, EmailLogStatus, Status } from "@/generated/prisma/enums";
import { getFirstScheduleTime, getNextScheduleTime } from "@/lib/utils";


export const DELETE = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const contactId = (await params).id;

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { user: true }
  });

  if (!contact || contact.user.email !== session.user.email) {
    throw new FrostError("Contact not found or unauthorized", 404);
  }

  await prisma.emailLog.deleteMany({
    where: {
      contactId: contactId,
      status: EmailLogStatus.SCHEDULED
    }
  });

  await prisma.contact.delete({
    where: { id: contactId }
  });

  return new NextResponse(null, { status: 204 });
});

export const PATCH = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const contactId = (await params).id;
  const body = await req.json();
  const { status } = body;

  if (!status) {
    throw new FrostError("Status is required", 400);
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { user: true }
  });

  if (!contact || contact.user.email !== session.user.email) {
    throw new FrostError("Contact not found or unauthorized", 404);
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: { status }
  });

  if (status !== Status.ACTIVE) {
    await prisma.emailLog.deleteMany({
      where: {
        contactId,
        status: EmailLogStatus.SCHEDULED
      }
    });
  } else if (status === Status.ACTIVE && contact.status !== Status.ACTIVE) {
    // Reactivating: Check if we need to reschedule
    const campaign = await prisma.campaign.findUnique({
      where: { id: contact.campaignId }
    });

    if (campaign?.status !== CampaignStatus.ACTIVE) {
      return new NextResponse(null, { status: 204 });
    }

    const existingScheduled = await prisma.emailLog.findFirst({
      where: {
        contactId,
        status: EmailLogStatus.SCHEDULED
      }
    });

    if (existingScheduled) {
      return new NextResponse(null, { status: 204 });
    }

    const lastSentLog = await prisma.emailLog.findFirst({
      where: {
        contactId,
        status: EmailLogStatus.SENT,
      },
      orderBy: { sequence: 'desc' }
    });

    let nextSeq = 1;
    if (lastSentLog) nextSeq = lastSentLog.sequence + 1;

    const nextStep = await prisma.campaignTemplate.findFirst({
      where: {
        campaignId: contact.campaignId,
        sequence: nextSeq
      }
    });

    if (!nextStep) return new NextResponse(null, { status: 204 });

    const { mailSendingTime, sendOnWeekends, timezone } = await prisma.preferences.findUnique({
      where: { userId: session.user.id },
      select: { mailSendingTime: true, sendOnWeekends: true, timezone: true }
    }) || { mailSendingTime: "09:00", sendOnWeekends: false, timezone: "Asia/Kolkata" };

    let targetTime: Date;

    if (nextSeq === 1) {
      targetTime = getFirstScheduleTime(mailSendingTime, timezone, sendOnWeekends);
    } else {
      targetTime = getNextScheduleTime(mailSendingTime, timezone, sendOnWeekends, lastSentLog?.sentAt || new Date(), nextStep.delay);
    }

    await prisma.emailLog.create({
      data: {
        campaignId: contact.campaignId,
        templateId: nextStep.templateId,
        contactId: contact.id,
        sequence: nextSeq,
        status: EmailLogStatus.SCHEDULED,
        scheduledAt: targetTime
      }
    });
  }

  return new NextResponse(null, { status: 204 });
});
