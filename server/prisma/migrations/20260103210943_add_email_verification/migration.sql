-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerificationCode" TEXT,
ADD COLUMN "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passwordResetCode" TEXT,
ADD COLUMN "passwordResetCodeExpires" TIMESTAMP(3);

