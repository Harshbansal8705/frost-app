import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";
import { FrostError } from "@/types";
import { revalidatePath } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = safeAPI(async (req: Request) => {
  const session = await authenticateUser();

  const templates = await prisma.template.findMany({
    where: { user: { id: session.user.id } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
});

export const POST = safeAPI(async (req: Request) => {
  const session = await authenticateUser();

  const body = await req.json();
  const { name, subject, body: content, attachments } = body;

  if (!name || !subject || !content) {
    throw new FrostError("Missing required fields", 400);
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

  revalidatePath("/dashboard/templates");

  return NextResponse.json(template);
});
