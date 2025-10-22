# Deploy to Render - Complete Guide

This guide will help you deploy your Trendz application to Render with zero configuration issues.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A GitHub account
3. Your project pushed to GitHub
4. A PostgreSQL database on Render

## Step 1: Prepare Your Code for GitHub

### 1.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Ready for Render deployment"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., "trendz-app")
3. **Don't** initialize with README, .gitignore, or license

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `trendz-database`
   - **Region**: Choose closest to you
   - **Instance Type**: Free (or paid for production)
4. Click **Create Database**
5. Wait for database to be created (this takes 1-2 minutes)

### 2.1 Get Database URL

1. Once created, click on your database
2. Scroll to **Connections**
3. Copy the **Internal Database URL** (starts with `postgresql://`)
   - **Important**: Use the INTERNAL URL (not External)
   - Format: `postgresql://user:password@hostname/database`

## Step 3: Create Web Service on Render

### 3.1 Create New Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Select the repository you just pushed

### 3.2 Configure Build & Deploy Settings

Fill in the following settings:

**Basic Settings:**
- **Name**: `trendz-app` (or your preferred name)
- **Region**: Same as your database
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Node`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Instance Type:**
- Free (or paid for production)

### 3.3 Add Environment Variables

Click **Advanced** → **Add Environment Variable** and add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Paste the Internal Database URL from Step 2.1 |
| `SESSION_SECRET` | Generate with: `openssl rand -base64 32` |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Your GCS bucket ID (if using) |
| `PRIVATE_OBJECT_DIR` | Your GCS private dir (if using) |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Your GCS public paths (if using) |

**Important Notes:**
- Make sure `DATABASE_URL` is the **Internal Database URL** from Render PostgreSQL
- The URL should NOT have any `psql '` prefix or trailing quotes
- Clean format: `postgresql://user:password@hostname/database`

### 3.4 Auto-Deploy Settings

- **Auto-Deploy**: Enable (recommended)
- This will automatically deploy when you push to `main` branch

## Step 4: Deploy

1. Click **Create Web Service**
2. Render will start building your application
3. Watch the build logs for any errors

### Expected Build Process:

```
==> Cloning from https://github.com/YOUR_USERNAME/YOUR_REPO_NAME...
==> Running build command: npm install && npm run build
==> Installing dependencies...
==> Building frontend with Vite...
==> Building backend with esbuild...
==> Running database push with Drizzle...
==> Build complete!
==> Starting application with: npm start
==> Server listening on port 10000
==> Your service is live!
```

## Step 5: Verify Deployment

### 5.1 Check Service Status

1. Your service will be live at: `https://trendz-app.onrender.com`
2. Check the **Events** tab for deployment status
3. Check the **Logs** tab for runtime logs

### 5.2 Test Your Application

Visit your Render URL and verify:
- ✅ Homepage loads
- ✅ Can register/login
- ✅ Can create trends
- ✅ Database operations work
- ✅ No console errors

## Step 6: Deploy Frontend to Vercel (Optional)

If you want to deploy your frontend separately on Vercel:

### 6.1 Create vercel.json

This file is already in your project. It configures Vercel for frontend-only deployment.

### 6.2 Set Environment Variable

In Vercel project settings, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL (e.g., `https://trendz-app.onrender.com`) |

### 6.3 Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts:
- Link to existing project? **No**
- Project name? `trendz-frontend`
- Directory? `./`
- Build command? `vite build`
- Output directory? `dist/public`

## Troubleshooting

### Build Fails: "Cannot find module drizzle-kit"

**Solution**: drizzle-kit is already in dependencies. Clear Render cache:
1. Go to your service **Settings**
2. Click **Clear build cache & deploy**

### Build Fails: "No models defined in schema"

**Solution**: This project uses Drizzle ORM (not Prisma). The schema is in `shared/schema.ts` and is already configured.

### Runtime Error: "Database connection failed"

**Solution**: 
1. Verify `DATABASE_URL` is set correctly
2. Make sure you're using the **Internal Database URL**
3. Check that database is running in Render dashboard

### Port Errors: "Port 5000 not available"

**Solution**: Render automatically provides `PORT` environment variable. The app is configured to use it:
```javascript
const PORT = parseInt(process.env.PORT || '5000', 10);
```

### Application Crashes on Startup

**Solution**: Check the logs in Render dashboard:
1. Go to **Logs** tab
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Database connection issues
   - Build artifacts not found

### Frontend Can't Connect to Backend (Vercel + Render)

**Solution**: 
1. Verify `VITE_API_URL` is set in Vercel environment variables
2. Ensure CORS is enabled in backend (already configured)
3. Check browser console for CORS errors

## Best Practices

### 1. Use Environment-Specific Configurations

- Development: Replit or local
- Production: Render backend + Vercel frontend

### 2. Monitor Your Application

- Check Render logs regularly
- Set up error tracking (Sentry, etc.)
- Monitor database performance

### 3. Database Backups

Render Free tier doesn't include backups. For production:
- Upgrade to paid tier with backups
- Or manually export database regularly

### 4. Scaling

When your app grows:
- Upgrade Render instance type
- Enable autoscaling
- Consider CDN for static assets

## Summary

You now have:
- ✅ Code safely in GitHub
- ✅ PostgreSQL database on Render
- ✅ Backend deployed on Render
- ✅ (Optional) Frontend on Vercel
- ✅ Automatic deployments on git push

Your application is production-ready and will automatically deploy when you push changes to GitHub!

## Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: Create an issue in your repository
