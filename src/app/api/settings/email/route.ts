import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/api";
import prisma from "@/lib/prisma";
import { FrostSession, FrostError } from "@/types";
import nodemailer from 'nodemailer';
import imaps from 'imap-simple';

interface EmailSettingsPayload {
  fromName?: string;
  fromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPassword?: string;
}

export const PATCH = safeAPI(async (req: Request, session: FrostSession) => {
  const body = await req.json();
  const data = body as EmailSettingsPayload;

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
  if (data.smtpUser && data.smtpPassword) {
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

  if (data.imapUser && data.imapPassword) {
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
    fromName: data.fromName || existingSettings?.fromName || session.user.name || "",
    fromEmail: data.fromEmail || existingSettings?.fromEmail || session.user.email,
    smtpHost: data.smtpHost || existingSettings?.smtpHost,
    smtpPort: data.smtpPort || existingSettings?.smtpPort,
    smtpUser: data.smtpUser || existingSettings?.smtpUser || session.user.email,
    imapHost: data.imapHost || existingSettings?.imapHost,
    imapPort: data.imapPort || existingSettings?.imapPort,
    imapUser: data.imapUser || existingSettings?.imapUser || session.user.email,
    smtpPassword: data.smtpPassword || existingSettings?.smtpPassword || "",
    imapPassword: data.imapPassword || existingSettings?.imapPassword || "",
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

  return new NextResponse(null, { status: 204 });
});
