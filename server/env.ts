// Fix malformed DATABASE_URL before anything else runs
// This must be imported first in server/index.ts

if (process.env.DATABASE_URL) {
  let databaseUrl = process.env.DATABASE_URL;
  
  // Decode URL-encoded values first
  try {
    databaseUrl = decodeURIComponent(databaseUrl);
  } catch (e) {
    // If decoding fails, use as-is
  }
  
  // Remove 'psql ' prefix and surrounding quotes if present
  if (databaseUrl.startsWith("psql '") || databaseUrl.startsWith("psql")) {
    databaseUrl = databaseUrl.replace(/^psql\s*'?/, '').replace(/'$/, '').trim();
    process.env.DATABASE_URL = databaseUrl;
    console.log("⚠️  Fixed malformed DATABASE_URL - removed 'psql ' prefix");
  }
}

// Re-export for convenience
export const DATABASE_URL = process.env.DATABASE_URL;
