import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";

export const POST = safeAPI(async (req: Request, session: FrostSession) => {
  const body = await req.json();
  const { name, leads } = body;
  const { sequence } = body;

  if (!name) {
    throw new FrostError("Missing Campaign name", 400);
  }

  if (!Array.isArray(leads) || !Array.isArray(sequence)) {
    throw new FrostError("Invalid lead data: Leads and Sequence must be arrays", 400);
  }

  // Validate leads and type strictness
  const validLeads = leads.filter((l) => l.email && l.name && l.company) as { email: string; name: string; company: string }[];

  if (validLeads.length !== leads.length) {
    throw new FrostError("Invalid lead data: Email, Name and Company are required", 400);
  }

  // 1. Handle Companies - Bulk ensure companies exist
  const companyNames = [...new Set(validLeads.map(l => l.company))];

  // Find existing companies
  const existingCompanies = await prisma.company.findMany({
    where: {
      userId: session.user.id,
      name: { in: companyNames }
    }
  });

  const existingCompanyNames = new Set(existingCompanies.map(c => c.name));
  const missingCompanyNames = companyNames.filter(name => !existingCompanyNames.has(name));

  // Transaction to ensure everything is created or nothing is
  const campaign = await prisma.$transaction(async (tx) => {
    // 1. Create Campaign
    const camp = await tx.campaign.create({
      data: {
        title: name,
        userId: session.user.id,
      },
    });

    // 2. Create Contacts & Companies
    if (leads && leads.length > 0) {
      // Create missing companies
      if (missingCompanyNames.length > 0) {
        await tx.company.createMany({
          data: missingCompanyNames.map(name => ({
            name,
            userId: session.user.id
          })),
          skipDuplicates: true
        });
      }

      // Fetch all companies to ensure we have all IDs
      const allCompanies = await tx.company.findMany({
        where: {
          userId: session.user.id,
          name: { in: companyNames }
        }
      });

      const companyMap = new Map(allCompanies.map(c => [c.name, c.id]));

      // 2. Prepare Contacts
      const contactData = validLeads.map(lead => ({
        name: lead.name,
        email: lead.email,
        userId: session.user.id,
        campaignId: camp.id,
        companyId: companyMap.get(lead.company)!,
      }));

      await tx.contact.createMany({
        data: contactData
      });
    }

    // 3. Create Templates (if needed) & Link Sequence
    if (sequence.length > 0) {
      const invalidStep = sequence.find((s) => !s.templateId);
      if (invalidStep) {
        throw new FrostError("Invalid template data: Template ID is required", 400);
      }
      const templateData = sequence.map((step, i) => ({
        campaignId: camp.id,
        templateId: step.templateId,
        sequence: i + 1,
        delay: i ? step.delay : 0,
      }));

      await tx.campaignTemplate.createMany({
        data: templateData
      });
    }

    return camp;
  });

  return NextResponse.json(campaign);
});
