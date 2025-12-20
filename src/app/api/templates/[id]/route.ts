import { NextResponse } from "next/server";
import { FrostError, safeAPI } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";

export const GET = safeAPI(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await authenticateUser();
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

export const DELETE = safeAPI(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await authenticateUser();
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
