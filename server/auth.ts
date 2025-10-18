import express from "express";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

const router = express.Router();

/** Hash a password */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/** Compare passwords */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/** Remove sensitive info (like password) from user objects */
export function sanitizeUser(user: any) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

/** Middleware to protect routes that require authentication */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/** Example route for testing */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.session.user) });
});

/** ✅ Default export so index.ts can import authRoutes */
export default router;
