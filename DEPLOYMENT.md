# Deployment Guide - Trendx

This guide explains how to deploy your Trendx application to Render with Cloudflare integration.

## Issues Fixed

### 1. **Static File Serving Path**
- **Problem**: Server couldn't find build directory in production
- **Fix**: Updated `server/helpers.ts` to correctly resolve paths for both development and production environments
- **Path**: In production, server runs from `dist/index.js` and serves client from `../client/dist`

### 2. **CORS Configuration**
- **Problem**: Authentication failed due to CORS blocking requests
- **Fix**: Implemented smart CORS handling that:
  - Allows Replit preview URLs (`*.replit.dev`, `*.repl.co`)
  - Allows Render URLs (`RENDER_EXTERNAL_URL` env var)
  - Allows custom Cloudflare domains (`FRONTEND_URL` env var)
  - Allows localhost for development
  - Blocks unknown origins in production

### 3. **Session Configuration**
- **Problem**: Sessions not persisting properly across requests
- **Fix**: 
  - Added `SESSION_SECRET` environment variable requirement for production
  - Configured secure cookies with `sameSite: 'none'` for cross-origin requests
  - Added trust proxy for Render's reverse proxy
  - Session store uses PostgreSQL for persistence

### 4. **Environment Variables**
- **Problem**: Missing required environment variables
- **Fix**: Created `.env.example` with all required variables and validation

## Environment Variables Required

### On Render Dashboard

Set these environment variables in your Render service:

```bash
# Database (automatically set if using Render PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# Session Secret (REQUIRED - generate a random string)
SESSION_SECRET=your-random-secret-key-min-32-characters-long

# Frontend URL (your Cloudflare domain)
FRONTEND_URL=https://yourdomain.com

# Render URL (automatically set by Render)
RENDER_EXTERNAL_URL=https://your-app.onrender.com

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_BASE=https://your-bucket.your-account-id.r2.cloudflarestorage.com

# Node Environment
NODE_ENV=production
```

## Deployment Steps

### Step 1: Build Configuration

Your `package.json` already has the correct build scripts:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### Step 2: Render Configuration

Create a new Web Service on Render with these settings:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: `Node`
- **Plan**: Choose your plan

### Step 3: Database Setup

1. Create a PostgreSQL database on Render
2. Link it to your web service
3. The `DATABASE_URL` will be automatically set

### Step 4: Cloudflare Configuration

1. Add your Render URL as a CNAME record in Cloudflare
2. Set `FRONTEND_URL` to your Cloudflare domain
3. Update SSL/TLS mode to "Full" or "Full (strict)"

### Step 5: Test Authentication

After deployment:

1. Visit your Cloudflare domain
2. Try signing up a new user
3. Try logging in
4. Verify session persistence by refreshing the page

## Troubleshooting

### "CORS Error" in Browser Console

**Solution**: 
- Verify `FRONTEND_URL` is set correctly on Render
- Check Cloudflare proxy settings (orange cloud should be ON)
- Ensure `RENDER_EXTERNAL_URL` matches your actual Render URL

### "Session not persisting"

**Solution**:
- Verify `SESSION_SECRET` is set on Render
- Check that PostgreSQL database is connected
- Ensure cookies are enabled in your browser
- Verify `NODE_ENV=production` is set

### "Build directory not found"

**Solution**:
- Run `npm run build` locally to verify it works
- Check that `client/dist` directory is created after build
- Verify no `.gitignore` rules exclude the dist folder during build

### "Database connection failed"

**Solution**:
- Check `DATABASE_URL` format (should start with `postgresql://`)
- Verify database is accessible from Render service
- Check firewall rules on database

## Local Development

To run locally:

```bash
# Install dependencies
npm install

# Run development server (no build needed)
npm run dev

# Access at http://localhost:5000
```

## Production Checklist

- [ ] `SESSION_SECRET` set (32+ character random string)
- [ ] `DATABASE_URL` configured
- [ ] `FRONTEND_URL` set to Cloudflare domain
- [ ] `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` set
- [ ] `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_BASE` configured
- [ ] `NODE_ENV=production` set
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] PostgreSQL database created and linked
- [ ] Cloudflare DNS configured
- [ ] SSL/TLS mode set to "Full" or "Full (strict)"

## Authentication Flow

1. **Sign Up**: POST `/api/auth/register`
   - Creates user in database
   - Creates session
   - Returns user object

2. **Login**: POST `/api/auth/login`
   - Validates credentials
   - Creates session
   - Returns user object

3. **Get Current User**: GET `/api/auth/me`
   - Returns current user if authenticated
   - Returns 401 if not authenticated

4. **Logout**: POST `/api/auth/logout`
   - Destroys session
   - Clears cookies

## Security Notes

- Sessions are stored in PostgreSQL (persistent across server restarts)
- Cookies are HTTP-only (not accessible via JavaScript)
- Cookies are secure in production (HTTPS only)
- CORS is strictly configured for production
- Passwords are hashed with bcrypt
- Trust proxy enabled for Render's reverse proxy

## Support

If you encounter issues:

1. Check Render logs for server errors
2. Check browser console for client errors
3. Verify all environment variables are set
4. Test authentication endpoints directly with Postman
5. Check network tab for CORS errors
