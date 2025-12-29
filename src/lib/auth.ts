import GoogleProvider from "next-auth/providers/google"
import { env } from "@/env"
import { NextAuthOptions } from "next-auth"

import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/auth/signin",
  },
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
        })

        if (user) {
          session.user = user;
        } else {
          // User deleted from DB, but valid token exists.
          // We should invalidate the session.
          // Returning null/undefined here might break types but effectively kills usage.
          // A safer way is ensuring session.user is cleared.
          session.user = undefined;
        }
      }
      return session
    },
  },
  events: {
    async createUser(message) {
      const { user } = message;
      await prisma.emailSettings.create({
        data: {
          user: {
            connect: {
              id: user.id,
            }
          },
          fromName: user.name || "",
          fromEmail: user.email || "",
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          smtpUser: user.email || "",
          smtpPassword: "",
          imapHost: "imap.gmail.com",
          imapPort: 993,
          imapUser: user.email || "",
          imapPassword: "",
        },
      });
    },
  },
}
