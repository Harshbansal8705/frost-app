'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FrostError } from "@/types";
import { authenticateUser } from "@/lib/auth-helper";
import { EmailLogStatus, Status, CampaignStatus } from "@/generated/prisma/enums";
import { EmailLogCreateManyInput } from "@/generated/prisma/models";

// Helper to calculate "Today or Tomorrow at [timeStr]" in UTC
// Helper to handle weekend skipping
function adjustForWeekend(date: Date, allowWeekends: boolean): Date {
  if (allowWeekends) return date;

  const d = new Date(date);
  const day = d.getDay();

  // 0 = Sunday, 6 = Saturday
  if (day === 0) {
    // Sunday -> Monday (+1 day)
    d.setDate(d.getDate() + 1);
  } else if (day === 6) {
    // Saturday -> Monday (+2 days)
    d.setDate(d.getDate() + 2);
  }

  return d;
}

// Helper to calculate "Today or Tomorrow at [timeStr]" in UTC
function getScheduleTime(timeStr: string = "09:00", allowWeekends: boolean = false): Date {
  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);

  const targetDate = new Date(now);
  targetDate.setUTCHours(hours, minutes, 0, 0);

  // If target time for today has already passed, move to tomorrow
  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  // Check for weekends
  return adjustForWeekend(targetDate, allowWeekends);
}

export async function updateCampaign(campaignId: string, data: { title?: string; status?: CampaignStatus }) {
  const session = await authenticateUser();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { user: true }
  });

  if (!campaign || campaign.user.email !== session.user.email) {
    throw new FrostError("Campaign not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data
    });

    // Handle Status Transitions
    if (data.status === CampaignStatus.DRAFT) {
      // 1. DRAFT: Stop everything (Delete SCHEDULED logs)
      await tx.emailLog.deleteMany({
        where: {
          campaignId,
          status: EmailLogStatus.SCHEDULED
        }
      });

    } else if (data.status === CampaignStatus.ACTIVE) {
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
              const delayMs = (nextStep.delay || 1) * 24 * 60 * 60 * 1000;
              targetTime = new Date(lastLog.sentAt.getTime() + delayMs);

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

  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath('/dashboard/campaigns');
}

export async function deleteCampaign(campaignId: string) {
  const session = await authenticateUser();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { user: true }
  });

  if (!campaign || campaign.user.email !== session.user.email) {
    throw new FrostError("Campaign not found");
  }

  await prisma.campaign.delete({
    where: { id: campaignId }
  });

  revalidatePath('/dashboard/campaigns');
}

export async function addContactToCampaign(campaignId: string, contactData: { email: string; name?: string; companyName?: string }) {
  const session = await authenticateUser();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new FrostError("User not found");

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.userId !== user.id) {
    throw new FrostError("Campaign not found");
  }

  if (!contactData.companyName) throw new FrostError("Company name is required");

  // Find or create company
  let companyId = "";

  const company = await prisma.company.findFirst({
    where: { userId: user.id, name: contactData.companyName }
  });

  if (!company) {
    companyId = await prisma.company.create({
      data: {
        name: contactData.companyName,
        userId: user.id
      }
    }).then((company) => company.id);
  } else {
    companyId = company.id;
  }

  const newContact = await prisma.contact.create({
    data: {
      email: contactData.email,
      name: contactData.name || "",
      userId: user.id,
      campaignId: campaignId,
      companyId: companyId,
      status: Status.ACTIVE
    }
  });

  // Get User Preferences
  const { mailSendingTime, sendOnWeekends } = await prisma.preferences.findUnique({
    where: { userId: user.id },
    select: { mailSendingTime: true, sendOnWeekends: true }
  }) || { mailSendingTime: "09:00", sendOnWeekends: false };

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
        scheduledAt: getScheduleTime(mailSendingTime, sendOnWeekends)
      }
    });
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`);
}

export async function removeContactFromCampaign(contactId: string) {
  const session = await authenticateUser();

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { user: true }
  });

  if (!contact || contact.user.email !== session.user.email) {
    throw new FrostError("Contact not found or unauthorized");
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

  revalidatePath(`/dashboard/campaigns/${contact.campaignId}`);
}

export async function addTemplateToCampaign(campaignId: string, templateId: string) {
  const session = await authenticateUser();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { user: true }
  });

  if (!campaign || campaign.user.email !== session.user.email) {
    throw new FrostError("Campaign not found");
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
  const { mailSendingTime, sendOnWeekends } = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
    select: { mailSendingTime: true, sendOnWeekends: true }
  }) || { mailSendingTime: "09:00", sendOnWeekends: false };

  if (nextSeq === 1) {
    const contacts = await prisma.contact.findMany({
      where: { campaignId, status: Status.ACTIVE }
    });

    // Filter out contacts who already have a log for Sequence 1 (e.g. if Step 1 was deleted and re-added)
    const existingLogs = await prisma.emailLog.findMany({
      where: {
        campaignId,
        sequence: 1,
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
          scheduledAt: getScheduleTime(mailSendingTime, sendOnWeekends)
        }))
      });
    }
  } else {
    // Case 2: Subsequent Step - Catch-up logic
    // Optimized Query: Find contacts who finished previous step AND haven't started this step
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

    // Get delay for the new step
    const createdStep = await prisma.campaignTemplate.findFirst({
      where: { campaignId, sequence: nextSeq }
    });
    const delayMs = (createdStep?.delay || 1) * 24 * 60 * 60 * 1000;

    for (const contact of validContacts) {
      // The include filter guarantees we have the previous log here
      const previousLog = contact.emailLogs[0];
      if (!previousLog) continue;

      validContactIds.push(contact.id);

      let targetTime = new Date((previousLog.sentAt || new Date()).getTime() + delayMs);

      // Apply weekend check logic
      targetTime = adjustForWeekend(targetTime, sendOnWeekends);

      if (targetTime.getTime() < Date.now()) {
        targetTime = getScheduleTime(mailSendingTime, sendOnWeekends);
      }

      scheduleMap[contact.id] = targetTime;
    }

    if (validContactIds.length > 0) {
      await Promise.all(validContactIds.map(cid =>
        prisma.emailLog.create({
          data: {
            campaignId,
            templateId,
            contactId: cid,
            sequence: nextSeq,
            status: EmailLogStatus.SCHEDULED,
            scheduledAt: scheduleMap[cid]
          }
        })
      ));
    }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`);
}

export async function removeCampaignTemplate(campaignTemplateId: string) {
  const session = await authenticateUser();

  const campaignTemplate = await prisma.campaignTemplate.findUnique({
    where: { id: campaignTemplateId },
    include: { campaign: { include: { user: true } } }
  });

  if (!campaignTemplate || campaignTemplate.campaign.user.email !== session.user.email) {
    throw new FrostError("Template step not found or unauthorized");
  }

  // Ensure this is the last step in the sequence
  const params = await prisma.campaignTemplate.findFirst({
    where: { campaignId: campaignTemplate.campaignId },
    orderBy: { sequence: 'desc' }
  });

  if (params && params.id !== campaignTemplateId) {
    throw new FrostError("Can only remove the last step of the sequence");
  }

  // Delete scheduled logs for this sequence
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

  revalidatePath(`/dashboard/campaigns/${campaignTemplate.campaignId}`);
}

export async function updateCampaignTemplateDelay(campaignTemplateId: string, delay: number) {
  const session = await authenticateUser();

  const campaignTemplate = await prisma.campaignTemplate.findUnique({
    where: { id: campaignTemplateId },
    include: { campaign: { include: { user: true } } }
  });

  if (!campaignTemplate || campaignTemplate.campaign.user.email !== session.user.email) {
    throw new FrostError("Template step not found or unauthorized");
  }

  await prisma.campaignTemplate.update({
    where: { id: campaignTemplateId },
    data: { delay }
  });

  // Recalculate schedules for subsequent steps (Sequence > 1)
  // Step 1 is always scheduled for "Tomorrow 9AM" regardless of delay, so we skip it.
  if (campaignTemplate.sequence === 1) return;

  const { mailSendingTime, sendOnWeekends } = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
    select: { mailSendingTime: true, sendOnWeekends: true }
  }) || { mailSendingTime: "09:00", sendOnWeekends: false };

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

  const updatePromises = pendingLogs.map(log => {
    const prevLog = log.contact?.emailLogs[0];
    if (!prevLog?.sentAt) return null;

    const delayMs = delay * 24 * 60 * 60 * 1000;
    let targetTime = new Date(prevLog.sentAt.getTime() + delayMs);

    // Apply weekend logic
    targetTime = adjustForWeekend(targetTime, sendOnWeekends);

    // Apply catch-up logic: if calculated time is in the past, move to Next Slot (Tomorrow 9AM)
    if (targetTime.getTime() < Date.now()) {
      targetTime = getScheduleTime(mailSendingTime, sendOnWeekends);
    }

    return prisma.emailLog.update({
      where: { id: log.id },
      data: { scheduledAt: targetTime }
    });
  }).filter(Boolean);

  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }

  revalidatePath(`/dashboard/campaigns/${campaignTemplate.campaignId}`);
}

export async function updateContactStatus(contactId: string, status: Status) {
  const session = await authenticateUser();

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { user: true }
  });

  if (!contact || contact.user.email !== session.user.email) {
    throw new FrostError("Contact not found or unauthorized");
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: { status }
  });

  // If status is changed to anything other than ACTIVE, and potentially REPLIED/BOUNCED logic needs to run?
  // For manual updates, we mainly care about stopping emails.
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

    if (campaign?.status === CampaignStatus.ACTIVE) {
      // 1. Check if there are ALREADY scheduled logs (e.g. maybe they weren't deleted on pause, or race condition)
      // If we have scheduled logs, we assume the flow is active and don't double-schedule.
      const existingScheduled = await prisma.emailLog.findFirst({
        where: {
          contactId,
          status: EmailLogStatus.SCHEDULED
        }
      });

      if (!existingScheduled) {
        // 2. No scheduled logs. We need to "Resume".
        // Find where they left off.
        const lastSentLog = await prisma.emailLog.findFirst({
          where: {
            contactId,
            status: EmailLogStatus.SENT
          },
          orderBy: { sequence: 'desc' }
        });

        let nextSeq = 1;
        if (lastSentLog) {
          nextSeq = lastSentLog.sequence + 1;
        }

        // Get the template step for this sequence
        const nextStep = await prisma.campaignTemplate.findFirst({
          where: {
            campaignId: contact.campaignId,
            sequence: nextSeq
          }
        });

        if (nextStep) {
          // Calculate Timing
          const { mailSendingTime, sendOnWeekends } = await prisma.preferences.findUnique({
            where: { userId: session.user.id },
            select: { mailSendingTime: true, sendOnWeekends: true }
          }) || { mailSendingTime: "09:00", sendOnWeekends: false };

          let targetTime: Date;

          if (nextSeq === 1) {
            // Step 1: Always "Tomorrow or Today" based on pref
            targetTime = getScheduleTime(mailSendingTime, sendOnWeekends);
          } else {
            // Subsequent Steps: Based on Last Sent + Delay
            const delayMs = (nextStep.delay || 1) * 24 * 60 * 60 * 1000;
            const baseTime = lastSentLog?.sentAt ? lastSentLog.sentAt : new Date();
            targetTime = new Date(baseTime.getTime() + delayMs);

            // Apply weekend logic
            targetTime = adjustForWeekend(targetTime, sendOnWeekends);

            // Catch up: If calculated time is in past, schedule for next available slot
            if (targetTime.getTime() < Date.now()) {
              targetTime = getScheduleTime(mailSendingTime, sendOnWeekends);
            }
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
      }
    }
  }

  revalidatePath(`/dashboard/campaigns/${contact.campaignId}`);
}
