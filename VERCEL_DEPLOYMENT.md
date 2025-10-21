# Vercel Deployment Guide

## ⚠️ Important Notice

**Vercel is designed for frontend deployments and serverless APIs.** This application is a full-stack Express.js app with:
- Persistent WebSocket connections
- PostgreSQL session storage
- Complex API routes
- File upload handling

### Recommended Deployment Strategy:

1. **For Full Application**: Deploy to **Render** (see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md))
   - ✅ Full Express.js support
   - ✅ WebSocket support
   - ✅ PostgreSQL integration
   - ✅ Session persistence
   - ✅ File uploads

2. **For Frontend Only**: Deploy to **Vercel**
   - ✅ Lightning-fast CDN delivery
   - ✅ Automatic HTTPS
   - ✅ GitHub integration
   - ⚠️ API routes require serverless adaptation
   - ⚠️ No WebSocket support
   - ⚠️ No persistent connections

## Frontend-Only Deployment to Vercel

If you want to deploy **just the frontend** to Vercel and keep the backend on Render:

### Step 1: Deploy Backend to Render First

Follow the instructions in [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) to deploy your backend.

You'll get a Render URL like: `https://trendz-app.onrender.com`

### Step 2: Update Frontend API Configuration

Create a file `client/src/config.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

Update `client/src/lib/queryClient.ts` to use this:

```typescript
import { API_BASE_URL } from '@/config';

// Update apiRequest and getQueryFn to prepend API_BASE_URL
```

### Step 3: Configure Vercel

1. **Push code to GitHub/GitLab/Bitbucket**

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**:
   ```
   VITE_API_URL=https://trendz-app.onrender.com
   NODE_ENV=production
   ```

5. **Deploy**: Click "Deploy"

### Step 4: Update CORS on Backend

Update `server/index.ts` CORS configuration:

```typescript
app.use(
  cors({
    origin: [
      'https://your-app.vercel.app',
      'https://trendz-app.onrender.com'
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### Step 5: Configure Cookies

Update cookie settings in `server/index.ts`:

```typescript
cookie: {
  maxAge: 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,  // Always true for cross-domain
  sameSite: 'none',  // Required for cross-domain cookies
}
```

## Current Configuration

The included `vercel.json` is configured for frontend-only deployment:

```json
{
  "version": 2,
  "buildCommand": "npm install && npm run build",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": "client/dist"
}
```

## Limitations of Vercel Deployment

When deploying to Vercel (frontend only):

- ❌ **No backend API** (runs on Render separately)
- ❌ **No database access** (backend handles this)
- ❌ **No sessions** (backend handles this)
- ❌ **No file uploads** (backend handles this)
- ❌ **No WebSocket support** (backend handles this)
- ⚠️ **CORS configuration required** (cross-domain cookies)
- ⚠️ **Separate deployments** (frontend on Vercel, backend on Render)

## Alternative: Full-Stack on Vercel (Advanced)

To deploy the full stack to Vercel, you would need to:

1. **Refactor Express routes** to Vercel serverless functions
2. **Remove WebSocket support** (not supported)
3. **Adapt session handling** for serverless
4. **Reconfigure file uploads** for serverless
5. **Update database connections** for serverless (connection pooling)

This is **not recommended** for this application due to its complexity.

## Recommended Approach

**Deploy everything to Render** for the best experience:
- Single deployment
- Full feature support
- Easier to manage
- Better for this type of application

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete instructions.

## Need Help?

- For full-stack deployment: Use Render
- For frontend-only: Follow this guide
- For questions: Check [Vercel Docs](https://vercel.com/docs)
