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
}

import { NextResponse } from "next/server";

export type APIHandler<T = unknown, P = unknown> = (
  req: Request,
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
