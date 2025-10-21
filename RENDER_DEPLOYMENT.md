# Deploying to Render

This guide will help you deploy your Trendz social media application to Render.

## Prerequisites

- A [Render account](https://render.com)
- A PostgreSQL database (you can create one on Render)
- Your environment variables ready

## Project Structure

This is a full-stack application using:
- **Frontend**: React + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Google Cloud Storage (Replit Object Storage)

## Step 1: Prepare Your Repository

1. Push your code to GitHub, GitLab, or Bitbucket
2. Ensure `.gitignore` excludes `node_modules`, `.env`, and `dist/`

## Step 2: Create a PostgreSQL Database on Render

1. Log into your Render dashboard
2. Click "New +" → "PostgreSQL"
3. Configure your database:
   - **Name**: `trendz-database` (or your choice)
   - **Region**: Choose closest to your users
   - **Plan**: Free or paid tier
4. Click "Create Database"
5. **Save the Internal Database URL** - you'll need this for the web service

## Step 3: Create a Web Service

1. In Render dashboard, click "New +" → "Web Service"
2. Connect your repository
3. Configure the service:

### Basic Settings
- **Name**: `trendz-app` (or your choice)
- **Region**: Same as your database
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (uses root)
- **Runtime**: Node
- **Build Command**: `npm install && npm run build && npm run db:push`
  - _Alternative_: You can use the helper script: `bash render-build.sh`
- **Start Command**: `npm start`

### Environment Variables

Click "Advanced" and add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `DATABASE_URL` | (from Step 2) | Internal Database URL from your Render PostgreSQL |
| `SESSION_SECRET` | (generate random string) | Use: `openssl rand -base64 32` |
| `PORT` | `5000` | Render will override this automatically |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | (your GCS bucket ID) | From Replit Object Storage setup |
| `PRIVATE_OBJECT_DIR` | (your private dir) | From Replit Object Storage setup |
| `PUBLIC_OBJECT_SEARCH_PATHS` | (your public paths) | From Replit Object Storage setup |

**Note on Object Storage**: If you're migrating from Replit, you'll need to:
- Either continue using Replit's object storage (keep the keys)
- Or set up your own Google Cloud Storage bucket and update these variables

### Health Check Path (Optional but Recommended)
- **Health Check Path**: `/api/auth/me`
- **Health Check Interval**: 30 seconds

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Run `npm install` (installs all dependencies)
   - Run `npm run build` (builds frontend with Vite + backend with esbuild)
   - Run `npm run db:push` (creates database tables from Drizzle schema)
   - Start your application with `npm start`

## Step 5: Database Schema Setup

The build command includes `npm run db:push` which will:
- Connect to your PostgreSQL database using the DATABASE_URL
- Create all necessary tables based on your Drizzle schema (shared/schema.ts)
- Set up the complete database structure (users, trends, posts, votes, comments)

**Important**: The `db:push` step requires DATABASE_URL to be set in environment variables. If this step fails during build, the deployment will fail. Make sure your PostgreSQL database is created and DATABASE_URL is correctly configured before deploying.

## Step 6: Verify Deployment

1. Once deployment completes, visit your Render URL (e.g., `https://trendz-app.onrender.com`)
2. Check the deployment logs for any errors
3. Test user registration and login
4. Verify file uploads work correctly

## Troubleshooting

### Build Fails with "DATABASE_URL not found"
- Double-check the `DATABASE_URL` is set in Render environment variables
- Use the **Internal Database URL** from your Render PostgreSQL database

### Application crashes on startup
- Check the logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure `SESSION_SECRET` is set

### Database connection errors
- Verify `DATABASE_URL` is the Internal URL, not External
- Check that your database is in the same region as your web service
- Ensure the database is running and not suspended

### File uploads don't work
- Verify all object storage environment variables are set
- Check that your GCS bucket permissions are configured correctly
- Review the bucket ACL policies

### Session/Authentication issues
- Ensure `SESSION_SECRET` is set and is a strong random string
- Verify `NODE_ENV=production` is set
- Check that cookies are being sent with requests

## Local Development

To run locally after cloning:

```bash
# Install dependencies
npm install

# Create .env file with your variables (see .env.example)
cp .env.example .env

# Edit .env and add your values
nano .env

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Current Scripts in package.json

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

## Important Notes

1. **Free Tier Limitations**: Render's free tier spins down after 15 minutes of inactivity. First request after spindown will be slow (30-60s).

2. **Database Persistence**: Free tier databases are deleted after 90 days of inactivity. Consider upgrading for production use.

3. **Environment Variables**: Never commit `.env` files to your repository. Always set them in Render dashboard.

4. **Build Time**: First build takes 3-5 minutes. Subsequent builds are faster.

5. **Auto-Deploy**: By default, Render auto-deploys when you push to your main branch. You can disable this in settings.

## Need Help?

- Check Render's [documentation](https://render.com/docs)
- Review deployment logs in your Render dashboard
- Check application logs for runtime errors
- Verify all environment variables are correctly set

## Production Checklist

Before going live:

- [ ] All environment variables are set correctly
- [ ] `SESSION_SECRET` is a strong random string (not default)
- [ ] Database is created and accessible
- [ ] Object storage bucket is configured with proper permissions
- [ ] Test user registration and login
- [ ] Test file uploads (profile pictures, posts, trends)
- [ ] Test all major features (create trend, post, vote, comment)
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificate (automatic with Render)
- [ ] Set up monitoring/alerts (Render provides basic monitoring)
