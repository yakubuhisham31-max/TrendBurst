import "dotenv/config";
import dns from "node:dns";
import "./types"; // Import session type declarations
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;
import type { Pool as PgPool } from "pg";

import { registerRoutes } from "./routes";
import { serveStatic, log } from "./helpers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Local dev (especially on Windows) can hit ENETUNREACH when Node prefers IPv6
// for hosts that publish AAAA records (Supabase does). In production we keep
// the default behavior, but in local development we prefer IPv4.
if (process.env.NODE_ENV !== "production") {
  try {
    // Node >= 17
    dns.setDefaultResultOrder("ipv4first");
    log("🔧 DNS result order set to ipv4first (dev) to avoid IPv6 ENETUNREACH");
  } catch {
    // Ignore if not supported (older Node)
  }
}

// Trust proxy for Replit deployment (needed for secure cookies behind reverse proxy)
const isProd = process.env.NODE_ENV === "production";
app.set("trust proxy", isProd ? 1 : true);

// CORS setup - allow only specific origins and allow credentials
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://trend-burst-ncke.vercel.app",
  "https://trendx.social",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-this-in-production";
const PgSession = connectPgSimple(session);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

// Create PostgreSQL pool for session store
const sessionPool: PgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

// Configure session middleware
app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      createTableIfMissing: true,
      schemaName: "public",
      tableName: "sessions",
      disableTouch: true,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProd ? "none" : "lax",
    },
  })
);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Debug middleware for session issues
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api")) {
    log(
      `[Session Debug] Path: ${req.path}, Session ID: ${req.sessionID}, User ID: ${
        req.session.userId || "none"
      }`
    );
  }
  next();
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Initialize API routes
(async () => {
  try {
    const server = await registerRoutes(app);

    // Serve static frontend if it exists
    // Support both possible build output locations: dist/public (Vite) or dist
    const possibleDist = [
      path.join(__dirname, "../dist/public"),
      path.join(__dirname, "../dist"),
    ];
    const staticDistPath = possibleDist.find((p) => fs.existsSync(p));

    if (staticDistPath) {
      // Serve static assets
      app.use(express.static(staticDistPath));

      // SPA fallback: return index.html for any non-API route so client-side routing works
      app.get("/*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path.join(staticDistPath, "index.html"));
      });

      log(`🗂️ Serving static frontend from ${staticDistPath}`);
    }

    // Listen on port
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();