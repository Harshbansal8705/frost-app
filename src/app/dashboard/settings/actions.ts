"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FrostError } from "@/types";
import { authenticateUser } from "@/lib/auth-helper";
import { getOffsetMs, adjustTime } from "@/lib/utils";
import { z, ZodError } from "zod";

export interface EmailSettingsPayload {
  fromName?: string;
  fromEmail?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword?: string;
}

export interface ProfilePayload {
  name: string;
}

export interface PreferencesPayload {
  stopAllCompanyMailsOnReply: boolean;
  timezone: string;
  mailSendingTime: string;
  sendOnWeekends: boolean;
}

export async function getSettings() {
  const session = await authenticateUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      emailSettings: {
        omit: {
          smtpPassword: true,
          imapPassword: true,
        }
      },
      preferences: true,
    },
  });

  if (!user) {
    throw new FrostError("User not found", 404);
  }

  if (user.preferences) {
    const offset = getOffsetMs(user.preferences.timezone);
    // UTC to Local => UTC + Offset
    user.preferences.mailSendingTime = adjustTime(user.preferences.mailSendingTime, offset);
  }

  return {
    name: user.name,
    email: user.email,
    emailSettings: user.emailSettings,
    preferences: user.preferences,
  };
}

export async function updateProfile(data: ProfilePayload) {
  const session = await authenticateUser();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name },
  });

  revalidatePath("/dashboard/settings");
}

export async function updateEmailSettings(data: EmailSettingsPayload) {
  const session = await authenticateUser();

  // Check if settings exist to know if we are creating or updating
  const existingSettings = await prisma.emailSettings.findUnique({
    where: { userId: session.user.id },
  });

  const settingsData = {
    fromName: data.fromName,
    fromEmail: data.fromEmail,
    smtpHost: data.smtpHost,
    smtpPort: data.smtpPort,
    smtpUser: data.smtpUser,
    imapHost: data.imapHost,
    imapPort: data.imapPort,
    imapUser: data.imapUser,
    smtpPassword: data.smtpPassword,
    imapPassword: data.imapPassword,
  };

  if (existingSettings) {
    await prisma.emailSettings.update({
      where: { userId: session.user.id },
      data: settingsData,
    });
  } else {
    await prisma.emailSettings.create({
      data: {
        userId: session.user.id,
        ...settingsData,
      },
    });
  }

  revalidatePath("/dashboard/settings");
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

export async function updatePreferences(data: PreferencesPayload) {
  try {
    const session = await authenticateUser();

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

    revalidatePath("/dashboard/settings");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new FrostError(error.message, 400);
    }
    throw error;
  }
}
