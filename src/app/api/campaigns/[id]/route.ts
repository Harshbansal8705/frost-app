import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";
import { CampaignStatus, EmailLogStatus, Status } from "@/generated/prisma/enums";
import { EmailLogCreateManyInput } from "@/generated/prisma/models";
import { adjustForWeekend, getScheduleTime } from "@/lib/utils";


export const PATCH = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const campaignId = (await params).id;
  const body = await req.json();
  const { title, status } = body;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { user: true }
  });

  if (!campaign || campaign.user.id !== session.user.id) {
    throw new FrostError("Campaign not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        ...(title && { title }),
        ...(status && { status }),
      }
    });

    // Handle Status Transitions
    if (status === CampaignStatus.DRAFT) {
      // 1. DRAFT: Stop everything (Delete SCHEDULED logs)
      await tx.emailLog.deleteMany({
        where: {
          campaignId,
          status: EmailLogStatus.SCHEDULED
        }
      });

    } else if (status === CampaignStatus.ACTIVE) {
      // 2. ACTIVE: Reschedule / Resume
      const { mailSendingTime, sendOnWeekends } = await tx.preferences.findUnique({
        where: { userId: session.user.id },
        select: { mailSendingTime: true, sendOnWeekends: true }
      }) || { mailSendingTime: "09:00", sendOnWeekends: false };

      // Get all Active contacts
      const contacts = await tx.contact.findMany({
        where: { campaignId, status: Status.ACTIVE },
        include: {
          emailLogs: {
            orderBy: { sequence: 'desc' },
            take: 1
          }
        }
      });

      // Get all Steps to know delays
      const steps = await tx.campaignTemplate.findMany({
        where: { campaignId },
        orderBy: { sequence: 'asc' }
      });

      const stepsMap = new Map(steps.map(s => [s.sequence, s]));

      if (steps.length > 0) {
        const logsToCreate: EmailLogCreateManyInput[] = [];

        for (const contact of contacts) {
          // Determine next sequence
          const lastLog = contact.emailLogs[0];

          let nextSeq = 1;

          if (lastLog) {
            if (lastLog.status === EmailLogStatus.SENT) {
              nextSeq = lastLog.sequence + 1;
            } else {
              continue;
            }
          }

          const nextStep = stepsMap.get(nextSeq);
          if (!nextStep) continue; // No more steps

          // Calculate Time
          let targetTime: Date;

          if (nextSeq === 1) {
            targetTime = getScheduleTime(mailSendingTime, sendOnWeekends);
          } else {
            if (lastLog && lastLog.sequence === nextSeq - 1 && lastLog.sentAt) {
              const delayDays = nextStep.delay;
              targetTime = new Date(lastLog.sentAt);
              targetTime.setDate(targetTime.getDate() + delayDays);

              // Set specific time from preference
              const [hours, minutes] = mailSendingTime.split(':').map(Number);
              targetTime.setUTCHours(hours, minutes, 0, 0);

              // Apply weekend check logic specifically here
              targetTime = adjustForWeekend(targetTime, sendOnWeekends);

              // Catch up
              if (targetTime.getTime() < Date.now()) {
                targetTime = getScheduleTime(mailSendingTime, sendOnWeekends);
              }
            } else {
              targetTime = getScheduleTime(mailSendingTime, sendOnWeekends);
            }
          }

          logsToCreate.push({
            campaignId,
            templateId: nextStep.templateId,
            contactId: contact.id,
            sequence: nextSeq,
            status: EmailLogStatus.SCHEDULED,
            scheduledAt: targetTime
          });
        }

        if (logsToCreate.length > 0) {
          await tx.emailLog.createMany({ data: logsToCreate });
        }
      }
    }
  });

  return new NextResponse(null, { status: 204 });
});

export const DELETE = safeAPI(async (req: Request, session: FrostSession, { params }) => {
  const campaignId = (await params).id;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { user: true }
  });

  if (!campaign || campaign.user.email !== session.user.email) {
    throw new FrostError("Campaign not found", 404);
  }

  await prisma.campaign.delete({
    where: { id: campaignId }
  });

  return new NextResponse(null, { status: 204 });
});
