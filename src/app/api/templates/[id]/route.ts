import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/utils";
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

export const DELETE = safeAPI(async (req: Request, session: FrostSession, { params }: { params: Promise<{ id: string }> }) => {
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
