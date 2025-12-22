"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FrostError } from "@/types";
import { authenticateUser } from "@/lib/auth-helper";

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

export async function getSettings() {
  const session = await authenticateUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      emailSettings: true,
    },
  });

  if (!user) {
    throw new FrostError("User not found", 404);
  }

  return {
    name: user.name,
    email: user.email,
    emailSettings: user.emailSettings,
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
