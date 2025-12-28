import prisma from "@/lib/prisma";
import { FrostError } from "@/types";
import { authenticateUser } from "@/lib/auth-helper";


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

  return {
    name: user.name,
    email: user.email,
    emailSettings: user.emailSettings,
    preferences: user.preferences,
  };
}
