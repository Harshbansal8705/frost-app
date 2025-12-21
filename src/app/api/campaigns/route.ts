import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";

export const POST = safeAPI(async (req: Request, session: FrostSession) => {
  const body = await req.json();
  const { name, leads } = body;
  let { sequence } = body;

  if (!name) {
    throw new FrostError("Missing Campaign name", 400);
  }

  if (!sequence) sequence = [];

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
    for (const lead of leads) {
      if (!lead.email || !lead.name || !lead.company) {
        throw new FrostError("Invalid lead data: Email, Name and Company are required", 400);
      }
      const companyName = lead.company;

      let company = await tx.company.findFirst({
        where: { name: companyName, userId: session.user.id },
      });

      if (!company) {
        company = await tx.company.create({
          data: {
            name: companyName,
            userId: session.user.id,
          },
        });
      }

      await tx.contact.create({
        data: {
          name: lead.name,
          email: lead.email,
          userId: session.user.id,
          campaignId: camp.id,
          companyId: company.id,
        },
      });
    }

    // 3. Create Templates (if needed) & Link Sequence
    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      const templateId = step.templateId;

      if (!templateId) {
        throw new FrostError("Invalid template data: Template ID is required", 400);
      }

      await tx.campaignTemplate.create({
        data: {
          campaign: {
            connect: {
              id: camp.id
            }
          },
          template: {
            connect: {
              id: templateId
            }
          },
          sequence: i,
          delay: i ? step.delay : 0,
        }
      });
    }

    return camp;
  });

  return NextResponse.json(campaign);
});
