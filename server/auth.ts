import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import type { User } from "@shared/schema";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function sanitizeUser(user: User): Omit<User, "password"> {
  const { password, ...sanitized } = user;
  return sanitized;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
};
