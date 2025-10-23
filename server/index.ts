import "dotenv/config";
import "./env"; // Fix DATABASE_URL before any other imports
import "./types"; // Import session type declarations
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./helpers";

const app = express();

// Trust proxy for Replit deployment (needed for secure cookies behind reverse proxy)
app.set("trust proxy", 1);

// CORS configuration - MUST come before session middleware
app.use(
  cors({
    origin: true, // Allow all origins in Replit (same domain)
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PgStore = connectPgSimple(session);

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// Test database connection
pool.query('SELECT NOW()').then(() => {
  log('✅ Database connected successfully');
}).catch((error) => {
  console.error('❌ Database connection failed:', error);
});

app.use(
  session({
    store: new PgStore({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // IMPORTANT: Use production mode to prevent Vite crashes
  // Vite dev mode has a bug that causes process.exit(1) on errors
  // This cannot be fixed without editing server/vite.ts (which is forbidden)
  log('Serving static files from dist/public (production mode)');
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
