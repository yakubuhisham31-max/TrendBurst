import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { User } from "@shared/schema";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function sanitizeUser(user: User): Omit<User, "password"> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
