import { config } from 'dotenv';
config();

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL first 20 chars:', process.env.DATABASE_URL?.substring(0, 20));
console.log('DATABASE_URL format check:', process.env.DATABASE_URL?.startsWith('postgresql://') ? 'VALID' : 'INVALID');

if (process.env.DATABASE_URL?.includes("psql '")) {
  console.log('❌ ERROR: DATABASE_URL contains "psql \'" prefix - NEEDS TO BE FIXED!');
  console.log('Fix: Remove "psql \'" from the beginning and "\'" from the end in Replit Secrets');
} else if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
  console.log('❌ ERROR: DATABASE_URL does not start with postgresql://');
} else {
  console.log('✅ DATABASE_URL format looks correct');
}
