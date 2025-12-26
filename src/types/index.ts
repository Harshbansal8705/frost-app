import { NextResponse } from "next/server";
import { Session } from "next-auth";

export interface FrostSession extends Session {
  user: {
    email: string;
    id: string;
    name: string | null;
    emailVerified: Date | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class FrostError extends Error {
  code: number;

  constructor(message: string, code: number = 500) {
    super(message);
    this.name = "FrostError";
    this.code = code;
  }
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  attachments: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface SettingsData {
  name: string;
  email: string;
  emailSettings?: {
    fromName?: string | null;
    fromEmail?: string | null;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    imapHost: string;
    imapPort: number;
    imapUser: string;
  } | null;
  preferences?: {
    stopAllCompanyMailsOnReply: boolean;
    timezone: string;
    mailSendingTime: string;
    sendOnWeekends: boolean;
  } | null;
}

export type APIHandler<T = unknown, P = unknown> = (
  req: Request,
  params: { params: Promise<P> }
) => Promise<NextResponse<T>> | Promise<Response>;

export type AuthenticatedAPIHandler<T = unknown, P = unknown> = (
  req: Request,
  session: FrostSession,
  params: { params: Promise<P> }
) => Promise<NextResponse<T>> | Promise<Response>;

export interface Lead {
  name: string;
  email: string;
  company: string;
}

export interface SequenceStep {
  id: string;
  templateId: string;
  subject: string;
  body: string;
  delay: number;
  attachments: string[];
}
