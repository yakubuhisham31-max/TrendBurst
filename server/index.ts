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

// Suppress benign "relation already exists" errors from connect-pg-simple during session setup
const originalConsoleError = console.error;
const suppressedErrors = new Set<string>();

console.error = function(...args: any[]) {
  const message = String(args[0]?.message || args[0] || '');
  
  // Check for benign errors we've already logged
  if (suppressedErrors.has(message)) {
    return; // Don't log duplicate errors
  }
  
  // Suppress benign "relation already exists" errors from session store
  if ((message.includes('IDX_session_expire') || message.includes('relation')) && message.includes('already exists')) {
    suppressedErrors.add(message);
    return; // Silently ignore on first occurrence
  }
  
  originalConsoleError.apply(console, args);
};

app.use(
  session({
    store: new PgStore({
      pool,
      createTableIfMissing: false, // Table already exists, don't try to recreate
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

// Keep error suppression active throughout the app lifecycle
// Don't restore console.error - keep the suppression in place

// Add cache control headers to prevent browser caching (but exclude service workers)
app.use((req, res, next) => {
  // Don't apply strict cache control to service worker files
  if (!req.path.includes('Worker.js') && req.path !== '/manifest.json') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
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

// Serve /public folder statically at root (for PWA manifest, service workers, assets)
const publicPath = path.resolve(__dirname, "../public");
app.use(express.static(publicPath));
log(`📁 Serving /public statically from: ${publicPath}`);

// OneSignal service worker routes and manifest (MUST be before serveStatic - registered synchronously)
// Production: serve from dist (where build copies files)
// Development: serve from public or dist
const distPath = process.env.NODE_ENV === "production" 
  ? path.resolve(__dirname, "../dist")  // Production: dist is at same level as compiled server
  : path.resolve(__dirname, "../dist");  // Development: dist is at workspace root

// Serve manifest.json - try public first, then dist
app.get("/manifest.json", (_req, res) => {
  const possiblePaths = [
    path.join(publicPath, "manifest.json"),       // Try public folder first
    path.join(distPath, "manifest.json"),         // Try dist folder
    path.join(__dirname, "../public/manifest.json"), // Alternative public path
  ];

  let content = null;
  let usedPath = null;

  for (const manifestPath of possiblePaths) {
    try {
      if (fs.existsSync(manifestPath)) {
        content = fs.readFileSync(manifestPath, "utf-8");
        usedPath = manifestPath;
        break;
      }
    } catch (err) {
      // Continue to next path
    }
  }

  if (content) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=3600");
    log(`✅ Serving manifest.json from: ${usedPath}`);
    res.send(content);
  } else {
    console.error("❌ manifest.json not found in any of these paths:", possiblePaths);
    res.status(404).json({ error: "Manifest not found" });
  }
});

// Serve OneSignal service workers - try public first, then dist
const serveServiceWorker = (filename: string, req: any, res: Response) => {
  const possiblePaths = [
    path.join(publicPath, filename),       // Try public folder first
    path.join(distPath, filename),         // Try dist folder
    path.join(__dirname, `../public/${filename}`), // Alternative public path
  ];

  let content = null;
  let usedPath = null;

  for (const workerPath of possiblePaths) {
    try {
      if (fs.existsSync(workerPath)) {
        content = fs.readFileSync(workerPath, "utf-8");
        usedPath = workerPath;
        break;
      }
    } catch (err) {
      // Continue to next path
    }
  }

  if (content) {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "public, max-age=3600");
    log(`✅ Serving ${filename} from: ${usedPath}`);
    res.send(content);
  } else {
    console.error(`❌ ${filename} not found in any of these paths:`, possiblePaths);
    res.status(404).send(`${filename} not found`);
  }
};

app.get("/OneSignalSDKWorker.js", (req, res) => {
  serveServiceWorker("OneSignalSDKWorker.js", req, res);
});

app.get("/OneSignalSDKUpdaterWorker.js", (req, res) => {
  serveServiceWorker("OneSignalSDKUpdaterWorker.js", req, res);
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Don't try to send response if headers already sent
    if (res.headersSent) {
      console.error('Error (headers already sent):', err);
      return;
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Error:', err);
  });

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
