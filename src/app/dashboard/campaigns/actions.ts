'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FrostError } from "@/types";
import { authenticateUser } from "@/lib/auth-helper";

export async function updateCampaign(campaignId: string, data: { title?: string }) {
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

  await prisma.contact.create({
    data: {
      email: contactData.email,
      name: contactData.name || "",
      userId: user.id,
      campaignId: campaignId,
      companyId: companyId
    }
  });

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

  revalidatePath(`/dashboard/campaigns/${campaignTemplate.campaignId}`);
}
