# Deployment Guide - Trendz Social Media App

This guide covers deploying your Trendz application to different platforms.

## 📋 Quick Platform Comparison

| Platform | Best For | Difficulty | Full-Stack Support | Cost (Free Tier) |
|----------|----------|------------|-------------------|------------------|
| **Replit** | Development & Testing | ⭐ Easy | ✅ Yes | Limited compute |
| **Render** | Production Deployment | ⭐⭐ Medium | ✅ Yes | 750 hrs/month |
| **Vercel** | Frontend Only | ⭐⭐⭐ Hard | ❌ No* | Unlimited |

*Vercel requires serverless adaptation for full-stack apps

## 🎯 Recommended Deployment Strategy

### For Production (Recommended):
**Deploy to Render** - See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- ✅ Full Express.js support
- ✅ PostgreSQL database included
- ✅ WebSocket support
- ✅ Session persistence
- ✅ File uploads work out of the box
- ✅ Single deployment for frontend + backend

### For Development:
**Run on Replit** - Already configured!
- ✅ Instant preview
- ✅ Built-in database
- ✅ Object storage
- ✅ Collaborative coding

### For Frontend-Only:
**Deploy to Vercel** - See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- ✅ Lightning-fast CDN
- ⚠️ Backend must run separately (on Render)
- ⚠️ Requires CORS configuration
- ⚠️ More complex setup

## 🚀 Quick Start for Each Platform

### Replit (Current Environment)

Your app is already running on Replit! The following is already configured:

- ✅ Port: Automatically uses `process.env.PORT`
- ✅ Database: PostgreSQL via Replit Database
- ✅ Object Storage: Replit Object Storage
- ✅ Environment Variables: Set via Replit Secrets

**To run locally:**
```bash
npm run dev
```

**Required Secrets in Replit:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random secret for sessions
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- `PRIVATE_OBJECT_DIR`
- `PUBLIC_OBJECT_SEARCH_PATHS`

### Render (Recommended for Production)

**Quick Deploy:**
1. Create PostgreSQL database on Render
2. Create Web Service
3. Set environment variables
4. Deploy with build command: `npm install && npm run build && npm run db:push`

**See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete instructions**

### Vercel (Frontend Only)

**Quick Deploy:**
1. Deploy backend to Render first
2. Update frontend to use Render API URL
3. Deploy frontend to Vercel
4. Configure CORS

**See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete instructions**

## 🔧 Technical Requirements

### All Platforms

Your application is **already configured** for multi-platform deployment:

✅ **Dynamic Port Handling**
```typescript
const port = parseInt(process.env.PORT || '5000', 10);
```

✅ **Relative API URLs**
```typescript
// Frontend uses relative paths
fetch('/api/users')  // ✅ Works everywhere
```

✅ **Environment Variables**
```typescript
import "dotenv/config";  // For local development
process.env.DATABASE_URL  // For deployment
```

✅ **Build Commands**
```json
{
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js"
}
```

### Environment Variables Required

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

**Minimum required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random secret (generate with `openssl rand -base64 32`)

**For file uploads:**
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- `PRIVATE_OBJECT_DIR`
- `PUBLIC_OBJECT_SEARCH_PATHS`

## 📝 Deployment Checklist

Before deploying to any platform:

- [ ] All environment variables are set
- [ ] `SESSION_SECRET` is a strong random string (not default)
- [ ] Database connection string is correct
- [ ] Object storage is configured (if using file uploads)
- [ ] Build command is tested locally: `npm run build`
- [ ] Start command works: `npm start`
- [ ] All features tested in development

## 🐛 Troubleshooting

### Port Issues
- ✅ **Already Fixed**: Server uses `process.env.PORT || 5000`
- Check that your platform sets `PORT` environment variable

### Database Connection Errors
- Verify `DATABASE_URL` is set correctly
- Ensure URL doesn't have extra characters (like `psql '` prefix)
- Check database is running and accessible

### API Requests Fail
- ✅ **Already Fixed**: Frontend uses relative URLs (`/api/...`)
- No changes needed for different platforms

### Session/Cookie Issues
- Verify `SESSION_SECRET` is set
- Check `NODE_ENV=production` is set
- Ensure `trust proxy` is configured (already done in `server/index.ts`)

### CORS Errors
- Only applies when frontend and backend are on different domains
- Update CORS configuration in `server/index.ts`
- See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for cross-domain setup

## 📚 Additional Resources

- [Replit Docs](https://docs.replit.com/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

## Platform-Specific Guides

- **Render**: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) ⭐ Recommended
- **Vercel**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Local Development**: [QUICK_START.md](./QUICK_START.md)

## Need Help?

- Check the platform-specific guides above
- Review application logs for error messages
- Verify all environment variables are set
- Test the build process locally first

---

**Recommendation**: For production deployment of this full-stack application, **use Render**. It provides the best support for Express.js apps with PostgreSQL, sessions, and file uploads.
