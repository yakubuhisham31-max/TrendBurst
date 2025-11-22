import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export async function setupGoogleAuth(app: Express) {
  const clientID = process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("⚠️  Google OAuth not configured - missing VITE_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  
  // Determine callback URL with proper fallbacks for different environments
  let callbackURL: string;
  
  if (process.env.GOOGLE_CALLBACK_URL) {
    // Explicit override - highest priority
    callbackURL = process.env.GOOGLE_CALLBACK_URL;
  } else if (process.env.REPLIT_DOMAINS) {
    // Replit production deployment
    callbackURL = `https://${process.env.REPLIT_DOMAINS}/auth/google/callback`;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    // Replit dev environment
    callbackURL = `https://${process.env.REPLIT_DEV_DOMAIN}/auth/google/callback`;
  } else if (isProduction) {
    // Custom domain production (e.g., trendx.social)
    callbackURL = "https://trendx.social/auth/google/callback";
  } else {
    // Local development
    callbackURL = "http://localhost:5000/auth/google/callback";
  }

  console.log(`🔐 Google OAuth callback URL: ${callbackURL}`);

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Google profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName;
          const lastName = profile.name?.familyName;
          const fullName = firstName && lastName ? `${firstName} ${lastName}` : profile.displayName;
          const profilePicture = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          // Upsert user in database
          await storage.upsertUser({
            id: profile.id,
            email,
            fullName,
            profilePicture,
          });

          // Return user object for session with claims structure compatible with isAuthenticated middleware
          const user = {
            provider: "google", // Mark as Google OAuth user
            claims: {
              sub: profile.id, // User ID
              email,
              name: fullName,
              picture: profilePicture,
            },
            // No access_token, refresh_token, or expires_at for Google OAuth
            // The isAuthenticated middleware will need to handle this case
          };

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error as Error);
        }
      }
    )
  );

  // Google OAuth initiation route with account selection prompt
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account", // 🎯 Force account selection every time
    })
  );

  // Google OAuth callback route
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/?error=auth_failed",
    }),
    (req, res) => {
      console.log(`✅ Google OAuth successful for user: ${(req.user as any)?.claims?.email}`);
      // Successful authentication - redirect to home
      res.redirect("/");
    }
  );

  console.log("✅ Google OAuth configured successfully");
}
