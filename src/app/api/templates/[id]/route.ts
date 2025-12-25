import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";

export const GET = safeAPI(async (req: Request, session: FrostSession, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const template = await prisma.template.findUnique({
    where: {
      id,
      user: {
        id: session.user.id,
      }
    },
  });

  if (!template) {
    throw new FrostError("Template Not found", 404);
  }

  return NextResponse.json(template);
});

export const PUT = safeAPI(async (req: Request, session: FrostSession, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const { name, subject, body: content, attachments } = body;

  const template = await prisma.template.findUnique({
    where: {
      id,
      user: {
        id: session.user.id,
      }
    },
  });

  if (!template) {
    throw new FrostError("Template Not found", 404);
  }

  const updatedTemplate = await prisma.template.update({
    where: { id },
    data: {
      name,
      subject,
      body: content,
      attachments,
    }
  });

  return NextResponse.json(updatedTemplate);
});

export const DELETE = safeAPI(async (req: Request, session: FrostSession, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const template = await prisma.template.findUnique({
    where: {
      id,
      user: {
        id: session.user.id,
      }
    },
    include: {
      _count: {
        select: {
          campaigns: true
        }
      }
    }
  });

  if (!template) {
    throw new FrostError("Template Not found", 404);
  }

  if (template._count.campaigns > 0) {
    throw new FrostError("Template is linked with a campaign and cannot be unlinked or deleted.", 400);
  }

  await prisma.template.delete({
    where: {
      id,
      user: {
        id: session.user.id
      }
    },
  });

  return new NextResponse(null, { status: 204 });
});
