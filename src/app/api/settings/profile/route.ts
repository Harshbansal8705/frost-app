import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostError, FrostSession } from "@/types";

interface ProfilePayload {
  name?: string;
}

export const PATCH = safeAPI(async (req: Request, session: FrostSession) => {
  const body = await req.json();
  const { name } = body as ProfilePayload;

  if (!name || name.trim() === "") throw new FrostError("Name is required", 400);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
  });

  return new NextResponse(null, { status: 204 });
});
