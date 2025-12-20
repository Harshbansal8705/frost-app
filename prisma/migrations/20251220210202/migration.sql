-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "smtpHost" TEXT NOT NULL DEFAULT 'smtp.gmail.com',
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT NOT NULL,
    "smtpPassword" TEXT,
    "imapHost" TEXT NOT NULL DEFAULT 'imap.gmail.com',
    "imapPort" INTEGER NOT NULL DEFAULT 993,
    "imapUser" TEXT NOT NULL,
    "imapPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSettings_userId_key" ON "EmailSettings"("userId");

-- AddForeignKey
ALTER TABLE "EmailSettings" ADD CONSTRAINT "EmailSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
