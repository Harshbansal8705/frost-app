import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostSession } from "@/types";
import { getOffsetMs, adjustTime } from "@/lib/utils";
import { z } from "zod";

interface PreferencesPayload {
  stopAllCompanyMailsOnReply?: boolean;
  timezone?: string;
  mailSendingTime?: string;
  sendOnWeekends?: boolean;
}

const preferencesSchema = z.object({
  stopAllCompanyMailsOnReply: z.boolean(),
  timezone: z.string().refine((val) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: val });
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid timezone" }),
  mailSendingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  sendOnWeekends: z.boolean(),
});

export const PATCH = safeAPI(async (req: Request, session: FrostSession) => {
  const body = await req.json();
  const data = body as PreferencesPayload;

  const validatedData = preferencesSchema.parse(data);
  const offset = getOffsetMs(validatedData.timezone);
  const utcTime = adjustTime(validatedData.mailSendingTime, -offset);

  const preferencesData = {
    stopAllCompanyMailsOnReply: validatedData.stopAllCompanyMailsOnReply,
    timezone: validatedData.timezone,
    mailSendingTime: utcTime,
    sendOnWeekends: validatedData.sendOnWeekends,
  };

  const existingPreferences = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
  });

  if (existingPreferences) {
    await prisma.preferences.update({
      where: { userId: session.user.id },
      data: preferencesData,
    });
  } else {
    await prisma.preferences.create({
      data: {
        userId: session.user.id,
        ...preferencesData,
      },
    });
  }

  return new NextResponse(null, { status: 204 });
});
