import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const session = await authenticateUser();
    const body = await req.json();
    let { name, leads, sequence } = body;

    if (!name) {
      return new NextResponse("Missing Campaign name", { status: 400 });
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
          throw new Error("Invalid lead data: Email, Name and Company are required");
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
        let templateId = step.templateId;

        if (!templateId) {
          throw new Error("Invalid template data: Template ID is required");
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
  } catch (error: any) {
    console.error("[CAMPAIGNS_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: error.message?.includes("Invalid") ? 400 : 500 });
  }
}
