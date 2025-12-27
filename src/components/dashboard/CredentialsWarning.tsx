import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default async function CredentialsWarning() {
  const session = await authenticateUser();

  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { emailSettings: true }
  });

  if (!user) return null;

  const settings = user.emailSettings;
  const isMissing = !settings || !settings.imapUser || !settings.imapPassword || !settings.smtpUser || !settings.smtpPassword;

  if (!isMissing) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-amber-500 shrink-0" size={20} />
          <p className="text-amber-200 text-sm font-medium">
            Your email settings are incomplete. Campaigns will not run until you configure your SMTP/IMAP credentials.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="text-xs font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Configure Now &rarr;
        </Link>
      </div>
    </div>
  );
}
