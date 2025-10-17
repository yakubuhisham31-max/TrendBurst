cat > server/index.ts <<'TS'
import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Import routers / route registrars
import authRoutes from "./auth"; // router that exports auth endpoints (register, login, logout, me)
import { registerRoutes } from "./routes"; // big app routes that use app.post/get(...)

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 10000);

// ---------- CORS ----------
/*
  Allow local dev (vite) and your deployed frontend (vercel).
  If your Vercel domain differs, add it here.
*/
const allowedOrigins = [
  "http://localhost:5173",
  "https://trendburst.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// ---------- Body parsing ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Sessions ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ---------- Mount routers / routes ----------
// Mount small router-based auth endpoints (router handles /register, /login, /me etc.)
// These will be available at /api/auth/...
app.use("/api/auth", authRoutes);

// Register all other routes defined in server/routes.ts which expect `app`
// registerRoutes is async and returns http Server; call but ignore return.
(async () => {
  try {
    await registerRoutes(app);
  } catch (err) {
    console.error("Error registering routes:", err);
    process.exit(1);
  }

  // Simple health endpoint
  app.get("/", (_req, res) => res.send("Server is running 🚀"));

  app.listen(PORT, () => {
    console.log(`[express] serving on port ${PORT}`);
  });
})();
TS
