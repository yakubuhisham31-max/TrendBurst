import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./auth"; // import your auth routes if in same folder

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CORS setup — allows frontend & Render to share cookies
app.use(cors({
  origin: [
    "http://localhost:5173",          // local frontend
    "https://trendburst.onrender.com" // deployed frontend
  ],
  credentials: true, // allow cookies
}));

// ✅ Parse JSON request bodies
app.use(express.json());

// ✅ Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // secure cookies only in prod
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ✅ Routes
app.use("/api/auth", authRoutes);

// ✅ Simple test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`[express] serving on port ${PORT}`);
  console.log(`Your service is live 🎉`);
});
