import "dotenv/config";
import "./types"; // Import session type declarations
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./helpers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for Replit deployment (needed for secure cookies behind reverse proxy)
app.set("trust proxy", 1);

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-key";

// CORS configuration - MUST come before session middleware
const allowedOrigins = [
  'https://trendx.social', // Custom domain
  'https://www.trendx.social', // Custom domain with www
  process.env.FRONTEND_URL, // Production frontend URL (e.g., https://yourdomain.com)
  process.env.RENDER_EXTERNAL_URL, // Render's automatic URL
  /\.replit\.dev$/, // Replit preview URLs
  /\.repl\.co$/, // Replit URLs  
  /\.replit\.app$/, // Replit published app URLs
  /localhost:\d+$/, // Local development
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list or matches regex patterns
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          log(`⚠️  CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PgStore = connectPgSimple(session);

// Fix malformed DATABASE_URL (remove 'psql ' prefix and trailing quotes if present)
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Handle various malformed formats
if (databaseUrl.startsWith("psql '") || databaseUrl.startsWith("'psql ")) {
  log("⚠️  Fixing malformed DATABASE_URL - removing 'psql ' prefix");
  databaseUrl = databaseUrl.replace(/^'?psql '?/, '').replace(/'$/, '');
}

// Trim any extra whitespace or quotes
databaseUrl = databaseUrl.trim().replace(/^['"]|['"]$/g, '');

log(`📊 Database connection string format: ${databaseUrl.substring(0, 30)}...`);

const pool = new Pool({ connectionString: databaseUrl });

// Test database connection with better error handling
pool.query('SELECT NOW()').then(() => {
  log('✅ Database connected successfully');
}).catch((error) => {
  console.error('❌ Database connection failed:', error.message);
  console.error('DATABASE_URL format:', databaseUrl?.substring(0, 50) + '...');
  console.error('⚠️  Server will continue but features requiring database will fail');
});

// Validate required environment variables
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ SESSION_SECRET environment variable is required in production');
  process.exit(1);
}

app.use(
  session({
    store: new PgStore({
      pool,
      createTableIfMissing: true,
      disableTouch: false,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-key-not-for-production",
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN, // Optional: set cookie domain for cross-subdomain auth
    },
  })
);

// Add cache control headers to prevent browser caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// OneSignal service worker routes and manifest (MUST be before serveStatic - registered synchronously)
const publicPath = path.resolve(__dirname, "../public");
const distPath = process.env.NODE_ENV === "production" 
  ? path.resolve(__dirname)
  : path.resolve(__dirname, "../dist");

app.get("/manifest.json", (_req, res) => {
  try {
    // Try public folder first (where source file is)
    let manifestPath = path.join(publicPath, "manifest.json");
    let content;
    
    try {
      content = fs.readFileSync(manifestPath, "utf-8");
    } catch {
      // Fall back to dist folder if not in public
      manifestPath = path.join(distPath, "manifest.json");
      content = fs.readFileSync(manifestPath, "utf-8");
    }
    
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(content);
  } catch (error) {
    console.error("Failed to serve manifest.json from", publicPath, "or", distPath, ":", error);
    res.status(404).json({ error: "Manifest not found" });
  }
});

app.get("/OneSignalSDKWorker.js", (_req, res) => {
  try {
    const workerPath = path.join(distPath, "OneSignalSDKWorker.js");
    const content = fs.readFileSync(workerPath, "utf-8");
    res.setHeader("Content-Type", "application/javascript");
    res.send(content);
  } catch (error) {
    console.error("Failed to serve OneSignalSDKWorker.js:", error);
    res.status(404).send("Service worker not found");
  }
});

app.get("/OneSignalSDKUpdaterWorker.js", (_req, res) => {
  try {
    const workerPath = path.join(distPath, "OneSignalSDKUpdaterWorker.js");
    const content = fs.readFileSync(workerPath, "utf-8");
    res.setHeader("Content-Type", "application/javascript");
    res.send(content);
  } catch (error) {
    console.error("Failed to serve OneSignalSDKUpdaterWorker.js:", error);
    res.status(404).send("Service worker not found");
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Error:', err);
  });

  // Serve static files (production mode)
  // Note: Using production mode to avoid Vite config top-level await issues
  log('Serving static files from client/dist');
  serveStatic(app);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Use Replit-provided PORT or default to 5000
  const PORT = parseInt(process.env.PORT || '5000', 10);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
    log(`✅ Server ready at http://0.0.0.0:${PORT}`);
    
    // Health check after startup
    setTimeout(async () => {
      try {
        const testRes = await fetch(`http://localhost:${PORT}/health`);
        if (testRes.ok) {
          log(`✅ Health check passed`);
        }
      } catch (error) {
        log(`⚠️  Health check failed: ${error}`);
      }
    }, 100);
  });

  // Error handling
  server.on('error', (error: any) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use - server cannot start`);
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('Stack:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
  });

  // Keep the process alive with heartbeat logging
  let heartbeat = 0;
  setInterval(() => {
    heartbeat++;
    if (heartbeat % 10 === 0) { // Log every 5 minutes
      log(`Heartbeat ${heartbeat} - server still running`);
    }
  }, 30000);

  log('✅ Server initialization complete - entering event loop');
  
  // Log to confirm we're past initialization
  setTimeout(() => {
    log('✅ Still running after 5 seconds');
  }, 5000);
  
  setTimeout(() => {
    log('✅ Still running after 30 seconds');
  }, 30000);
})().catch((error) => {
  console.error('❌ Fatal error during startup:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
