# Fix DATABASE_URL in Replit

## Issue

The DATABASE_URL environment variable in Replit has an invalid format with extra characters:

**Current (Invalid):**
```
psql 'postgresql://user:pass@host/db?params'
```

**Should be:**
```
postgresql://user:pass@host/db?params
```

## How to Fix

### Option 1: Via Replit Secrets Tool (Recommended)

1. Open the **Secrets** tool in Replit:
   - Click "Tools" in the left sidebar
   - Select "Secrets"
   - Or use the search bar and type "Secrets"

2. Find the `DATABASE_URL` secret

3. Click the **three dots** (⋮) next to it

4. Click **"Edit"**

5. **Remove** the `psql '` prefix and the trailing `'`
   - Delete `psql '` from the beginning
   - Delete `'` from the end

6. The final value should start with `postgresql://` and end with the query parameters

7. Click **"Save"** or **"Update"**

8. **Restart your application** (the workflow will auto-restart)

### Option 2: Via Shell

If you have the cleaned DATABASE_URL value, you can update it via the Replit environment:

1. Copy the cleaned URL (without `psql '` prefix)
2. Go to Secrets tool
3. Edit DATABASE_URL
4. Paste the clean URL
5. Save

## Expected Format

Your DATABASE_URL should look like this:

```
postgresql://username:password@host:port/database?sslmode=require&other_params
```

**Example:**
```
postgresql://neondb_owner:npg_abc123@ep-example-123.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Verification

After updating, check the logs:

1. Restart the application
2. Check for "Invalid URL" errors
3. The errors should be gone
4. Application should connect to database successfully

## Why This Happened

The DATABASE_URL was likely copied from a `psql` command:

```bash
psql 'postgresql://...'
```

The `psql '` and closing `'` were accidentally included in the secret value.

## Need Help?

If you're still seeing errors after fixing:

1. Verify the DATABASE_URL format is correct
2. Check that there are no extra spaces or characters
3. Ensure the database is accessible
4. Check the application logs for specific error messages
