#!/usr/bin/env node
import { execSync } from 'child_process';

// Fix DATABASE_URL before running drizzle-kit
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL;
  
  // Decode URL-encoded values
  try {
    url = decodeURIComponent(url);
  } catch (e) {}
  
  // Remove 'psql ' prefix and quotes
  url = url.replace(/^psql\s*'?/, '').replace(/'$/, '').trim();
  
  // Update environment
  process.env.DATABASE_URL = url;
  console.log('✅ DATABASE_URL cleaned for drizzle-kit');
}

try {
  // Push schema to database
  execSync('npx drizzle-kit push', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ Database schema pushed successfully!');
} catch (error) {
  console.error('❌ Failed to push database schema:', error.message);
  process.exit(1);
}
