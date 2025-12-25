'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FrostError } from "@/types";
import { authenticateUser } from "@/lib/auth-helper";
import { EmailLogStatus, Status, CampaignStatus } from "@/generated/prisma/enums";

// Helper to calculate "Today or Tomorrow at [timeStr]" in UTC
function getScheduleTime(timeStr: string = "09:00"): Date {
  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);

  const targetDate = new Date(now);
  targetDate.setUTCHours(hours, minutes, 0, 0);

  // If target time for today has already passed, move to tomorrow
  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return targetDate;
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

  await prisma.campaign.update({
    where: { id: campaignId },
    data
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
  const { mailSendingTime } = await prisma.preferences.findUnique({
    where: { userId: user.id },
    select: { mailSendingTime: true }
  }) || { mailSendingTime: "09:00" };

  // Only schedule the first mail (Sequence 1)
  const firstStep = await prisma.campaignTemplate.findFirst({
    where: { campaignId, sequence: 1 }
  });

  if (firstStep) {
    await prisma.emailLog.create({
      data: {
        campaignId,
        templateId: firstStep.templateId,
        contactId: newContact.id,
        sequence: 1,
        status: EmailLogStatus.SCHEDULED,
        scheduledAt: getScheduleTime(mailSendingTime)
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
  const { mailSendingTime } = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
    select: { mailSendingTime: true }
  }) || { mailSendingTime: "09:00" };

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
          scheduledAt: getScheduleTime(mailSendingTime)
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
      if (targetTime.getTime() < Date.now()) {
        targetTime = getScheduleTime(mailSendingTime);
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

  const { mailSendingTime } = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
    select: { mailSendingTime: true }
  }) || { mailSendingTime: "09:00" };

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

    // Apply catch-up logic: if calculated time is in the past, move to Next Slot (Tomorrow 9AM)
    if (targetTime.getTime() < Date.now()) {
      targetTime = getScheduleTime(mailSendingTime);
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
