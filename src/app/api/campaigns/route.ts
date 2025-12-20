import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const session = await authenticateUser();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, leads, sequence } = body;

    if (!name || !sequence || sequence.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

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

      // 3. Create Templates & Sequence
      for (let i = 0; i < sequence.length; i++) {
        const step = sequence[i];

        const template = await tx.template.create({
          data: {
            name: `${name} - Step ${i + 1}`,
            subject: step.subject,
            body: step.body,
            attachments: step.attachments || [],
            userId: session.user.id,
          }
        });

        await tx.campaignTemplate.create({
          data: {
            campaignId: camp.id,
            templateId: template.id,
            sequence: i,
            delay: step.delay || 0,
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
