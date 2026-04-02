import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../db.js";
import Email from "./email.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const isGoogleAuthConfigured = Boolean(
  googleClientId && googleClientSecret
);

if (isGoogleAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId!,
        clientSecret: googleClientSecret!,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "/api/v1/users/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id, displayName, emails, photos } = profile;
          const email = emails?.[0]?.value;
          const name = displayName;
          const photo = photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          // Check if user exists with this Google ID
          const existingGoogleUser = await prisma.user.findUnique({
            where: { googleId: id },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          });

          if (existingGoogleUser) {
            // User exists with this Google ID
            return done(null, existingGoogleUser);
          }

          // Check if user exists with this email (account linking)
          const existingEmailUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingEmailUser) {
            // Link Google account to existing user
            const linkedUser = await prisma.user.update({
              where: { id: existingEmailUser.id },
              data: {
                googleId: id,
                profileImage: photo || existingEmailUser.profileImage,
                isEmailVerified: true, // Google OAuth users are already verified
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
              },
            });

            // Auto-subscribe user to newsletter (if not already subscribed)
            try {
              await prisma.newsletterSubscriber.upsert({
                where: { email: linkedUser.email },
                update: { name: linkedUser.name, isActive: true },
                create: {
                  email: linkedUser.email,
                  name: linkedUser.name,
                  isActive: true,
                },
              });
            } catch (newsletterError) {
              // Don't fail OAuth if newsletter subscription fails
              console.error(
                "Failed to subscribe user to newsletter:",
                newsletterError
              );
            }

            return done(null, linkedUser);
          }

          // Create new user with Google account
          const newUser = await prisma.user.create({
            data: {
              name: name || email.split("@")[0],
              email,
              googleId: id,
              profileImage: photo,
              role: "user",
              isEmailVerified: true, // Google OAuth users are already verified
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          });

          // Auto-subscribe user to newsletter
          try {
            await prisma.newsletterSubscriber.upsert({
              where: { email: newUser.email },
              update: { name: newUser.name, isActive: true },
              create: {
                email: newUser.email,
                name: newUser.name,
                isActive: true,
              },
            });
          } catch (newsletterError) {
            // Don't fail OAuth if newsletter subscription fails
            console.error(
              "Failed to subscribe user to newsletter:",
              newsletterError
            );
          }

          // Send welcome email to new Google OAuth user
          try {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            const url = `${frontendUrl}/me`;
            await new Email(newUser, url).sendWelcome();
          } catch (emailError) {
            // Don't fail OAuth if welcome email fails
            console.error(
              "Failed to send welcome email to new Google OAuth user:",
              emailError
            );
          }

          return done(null, newUser);
        } catch (error: any) {
          return done(error, undefined);
        }
      }
    )
  );
} else {
  console.warn(
    "Google OAuth is disabled. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it."
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
