import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";

export async function GET(req: Request) {
  try {
    const session = await authenticateUser();

    const templates = await prisma.template.findMany({
      where: { user: { id: session.user.id } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[TEMPLATES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await authenticateUser();

    const body = await req.json();
    const { name, subject, body: content, attachments } = body;

    if (!name || !subject || !content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        name,
        subject,
        body: content,
        attachments: attachments || [],
        user: {
          connect: { id: session.user.id },
        }
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[TEMPLATES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
