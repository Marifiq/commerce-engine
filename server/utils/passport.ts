import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../db.js";
import Email from "./email.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/users/auth/google/callback",
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
        let user = await prisma.user.findUnique({
          where: { googleId: id },
        });

        if (user) {
          // User exists with this Google ID
          return done(null, user);
        }

        // Check if user exists with this email (account linking)
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link Google account to existing user
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: id,
              profileImage: photo || user.profileImage,
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
              where: { email: user.email },
              update: { name: user.name, isActive: true },
              create: { email: user.email, name: user.name, isActive: true },
            });
          } catch (newsletterError) {
            // Don't fail OAuth if newsletter subscription fails
            console.error('Failed to subscribe user to newsletter:', newsletterError);
          }

          return done(null, user);
        }

        // Create new user with Google account
        user = await prisma.user.create({
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
            where: { email: user.email },
            update: { name: user.name, isActive: true },
            create: { email: user.email, name: user.name, isActive: true },
          });
        } catch (newsletterError) {
          // Don't fail OAuth if newsletter subscription fails
          console.error('Failed to subscribe user to newsletter:', newsletterError);
        }

        // Send welcome email to new Google OAuth user
        try {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const url = `${frontendUrl}/me`;
          await new Email(user, url).sendWelcome();
        } catch (emailError) {
          // Don't fail OAuth if welcome email fails
          console.error('Failed to send welcome email to new Google OAuth user:', emailError);
        }

        return done(null, user);
      } catch (error: any) {
        return done(error, undefined);
      }
    }
  )
);

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

