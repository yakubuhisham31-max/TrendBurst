import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Create table if it doesn't exist
    ttl: sessionTtl,
    tableName: "session", // Match existing table name (singular)
  });
  
  const isProduction = process.env.NODE_ENV === "production";
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Only require HTTPS in production
      sameSite: isProduction ? "none" : "lax", // Use 'none' in production for cross-site OAuth, 'lax' in dev
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const fullName = claims["first_name"] && claims["last_name"] 
    ? `${claims["first_name"]} ${claims["last_name"]}` 
    : undefined;
  
  await storage.upsertUser({
    id: String(claims["sub"]),
    email: claims["email"],
    fullName: fullName,
    profilePicture: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  // Note: trust proxy is set in server/index.ts before this function is called
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Get the correct callback URL - must match what's registered in Replit Auth
  const isProduction = process.env.NODE_ENV === "production";
  const callbackDomain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "localhost:5000";
  
  // Use explicit scheme override if provided, otherwise derive from environment
  // In production or when REPLIT_DOMAINS is set (deployed), use https
  // For local development (localhost), use http unless explicitly overridden
  const callbackScheme = process.env.REPLIT_CALLBACK_SCHEME || 
    (process.env.REPLIT_DOMAINS || isProduction ? "https" : "http");
  
  const strategy = new Strategy(
    {
      name: "replitauth",
      config,
      scope: "openid email profile offline_access",
      callbackURL: `${callbackScheme}://${callbackDomain}/api/callback`,
    },
    verify
  );
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Note: Replit Auth handles account selection at the Replit level
    // Users can choose their authentication method (Google, GitHub, X, Apple)
    // but cannot select specific accounts within those providers due to Replit Auth acting as an identity broker
    passport.authenticate("replitauth")(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate("replitauth", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Check if user is authenticated in Passport
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If no claims, user session is invalid
  if (!user || !user.claims) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If no expiration time, something's wrong
  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  
  // Token is still valid
  if (now < user.expires_at) {
    return next();
  }

  // Token expired, try to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
