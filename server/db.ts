import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dns from "node:dns";
import type { Pool as PgPool } from 'pg';

// Prefer IPv4 in local development to avoid Windows IPv6 ENETUNREACH to Supabase.
if (process.env.NODE_ENV !== "production") {
  try {
    // Node >= 17
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // ignore (older Node)
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// pg is a CommonJS module. Import the default and read the Pool constructor from it
const Pool = (pg as any).Pool;

export const pool: PgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // In production we enable SSL but allow self-signed/rejectUnauthorized false for hosts like Supabase
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });
