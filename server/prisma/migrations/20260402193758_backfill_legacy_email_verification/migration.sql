-- Backfill legacy users created before email verification existed.
-- New signups create a verification code immediately, so only rows with no
-- verification metadata are treated as legacy and marked verified.
UPDATE "User"
SET
  "isEmailVerified" = true
WHERE
  "isEmailVerified" = false
  AND "emailVerificationCode" IS NULL
  AND "emailVerificationExpires" IS NULL;
