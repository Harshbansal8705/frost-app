"use server";

import nodemailer from 'nodemailer';
import imaps from 'imap-simple';
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FrostError } from "@/types";
import { authenticateUser } from "@/lib/auth-helper";
import { getOffsetMs, adjustTime } from "@/lib/utils";
import { z } from "zod";

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

  // If password is not provided for update, fetch from DB to use for verification
  let smtpPassword = data.smtpPassword;
  let imapPassword = data.imapPassword;

  // We need the existing settings to know if we are creating or updating, and to get passwords if missing
  const existingSettings = await prisma.emailSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!smtpPassword || !imapPassword) {
    if (existingSettings) {
      if (!smtpPassword) smtpPassword = existingSettings.smtpPassword || "";
      if (!imapPassword) imapPassword = existingSettings.imapPassword || "";
    }
  }

  // Verification Logic - START
  // Only verify if the user has explicitly entered a password (indicating a change or first-time setup)
  if (data.smtpPassword) {
    if (!smtpPassword) throw new FrostError("SMTP Password is required", 400);

    // 1. Verify SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: data.smtpHost,
        port: data.smtpPort,
        secure: data.smtpPort === 465,
        auth: {
          user: data.smtpUser,
          pass: smtpPassword,
        }
      });
      await transporter.verify();
    } catch (error: unknown) {
      console.log(error);
      const isAuthError = (error as { responseCode: number }).responseCode === 535 || (error as { message: string }).message?.includes("Invalid login") || (error as { message: string }).message?.includes("Username and Password not accepted");
      if (isAuthError) {
        throw new FrostError("Invalid SMTP credentials. Please check your username and password.", 400);
      }
      throw new FrostError(`SMTP Connection Failed: ${(error as { message: string }).message}`, 400);
    }
  }

  if (data.imapPassword) {
    if (!imapPassword) throw new FrostError("IMAP Password is required", 400);

    // 2. Verify IMAP
    try {
      const config: imaps.ImapSimpleOptions = {
        imap: {
          user: data.imapUser,
          password: imapPassword,
          host: data.imapHost,
          port: data.imapPort,
          tls: data.imapPort === 993,
          tlsOptions: { rejectUnauthorized: false },
          authTimeout: 5000
        }
      };
      const connection = await imaps.connect(config);
      await connection.end();
    } catch (error: unknown) {
      console.log(error);
      const errorMessage = (error as { message: string }).message?.toLowerCase() || "";
      const isAuthError = errorMessage.includes("login failed") || errorMessage.includes("authentication failed") || errorMessage.includes("invalid credentials");
      if (isAuthError) {
        throw new FrostError("Invalid IMAP credentials. Please check your username and password.", 400);
      }
      throw new FrostError(`IMAP Connection Failed: ${(error as { message: string }).message}`, 400);
    }
  }

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
    if (error instanceof FrostError) {
      throw new FrostError(error.message, 400);
    }
    throw error;
  }
}

export async function verifyEmailSettings(data: EmailSettingsPayload) {
  const session = await authenticateUser();

  // If password is not provided, fetch from DB
  let smtpPassword = data.smtpPassword;
  let imapPassword = data.imapPassword;

  if (!smtpPassword || !imapPassword) {
    const existing = await prisma.emailSettings.findUnique({
      where: { userId: session.user.id }
    });
    if (existing) {
      if (!smtpPassword) smtpPassword = existing.smtpPassword || "";
      if (!imapPassword) imapPassword = existing.imapPassword || "";
    }
  }

  if (!smtpPassword) throw new FrostError("SMTP Password is required for verification", 400);
  if (!imapPassword) throw new FrostError("IMAP Password is required for verification", 400);

  // 1. Verify SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: data.smtpHost,
      port: data.smtpPort,
      secure: data.smtpPort === 465,
      auth: {
        user: data.smtpUser,
        pass: smtpPassword,
      }
    });
    await transporter.verify();
  } catch (error) {
    console.log(error);
    throw new FrostError(`SMTP Connection Failed`, 400);
  }

  // 2. Verify IMAP
  try {
    const config: imaps.ImapSimpleOptions = {
      imap: {
        user: data.imapUser,
        password: imapPassword,
        host: data.imapHost,
        port: data.imapPort,
        tls: data.imapPort === 993,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 5000
      }
    };
    const connection = await imaps.connect(config);
    await connection.end();
  } catch (error) {
    console.log(error);
    throw new FrostError(`IMAP Connection Failed`, 400);
  }

  return { success: true };
}
