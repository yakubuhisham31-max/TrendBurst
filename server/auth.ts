import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client"; // adjust if using another ORM
import { sanitizeUser } from "./utils"; // optional if you split your helpers

const router = Router();
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// --- Middleware to protect routes ---
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// --- Signup route ---
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await prisma.user.create({
      data: { email, password: hashed },
    });

    req.session.userId = newUser.id;
    res.json({ user: { id: newUser.id, email: newUser.email } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// --- Login route ---
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    req.session.userId = user.id;
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// --- Get current user ---
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// --- Logout ---
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Failed to log out" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

export default router;

/**
 * Alias signup route
 * Keeps same behavior as POST /register so clients calling /signup still work.
 * (Duplicate of /register handler)
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await prisma.user.create({
      data: { email, password: hashed },
    });

    req.session.userId = newUser.id;
    res.json({ user: { id: newUser.id, email: newUser.email } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
