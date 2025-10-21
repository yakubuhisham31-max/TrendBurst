# Quick Start Guide - Trendz

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit the .env file and add your values
nano .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random secret for sessions (generate with: `openssl rand -base64 32`)
- Object storage variables (if using file uploads)

### 3. Set Up Database
```bash
# Push schema to database (creates all tables)
npm run db:push
```

### 4. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Production Build (Local Testing)

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

## Deployment to Render

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete deployment instructions.

### Quick Render Checklist:
1. ✅ Create PostgreSQL database on Render
2. ✅ Create Web Service connected to your repo
3. ✅ Set environment variables in Render dashboard
4. ✅ Deploy (automatic build + schema push)

### Environment Variables for Render:
```
NODE_ENV=production
DATABASE_URL=<Internal Database URL from Render PostgreSQL>
SESSION_SECRET=<generate with: openssl rand -base64 32>
DEFAULT_OBJECT_STORAGE_BUCKET_ID=<your GCS bucket ID>
PRIVATE_OBJECT_DIR=<your private directory path>
PUBLIC_OBJECT_SEARCH_PATHS=<your public paths>
```

## Project Structure

```
├── client/              # React frontend (Vite)
├── server/              # Express backend
├── shared/              # Shared types and schemas (Drizzle)
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
├── RENDER_DEPLOYMENT.md # Full deployment guide
└── QUICK_START.md       # This file
```

## Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Shadcn/ui
- **Backend**: Express, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: Google Cloud Storage
- **Session**: PostgreSQL session store

## Need Help?

- Check the [full deployment guide](./RENDER_DEPLOYMENT.md)
- Review the logs if something isn't working
- Ensure all environment variables are set correctly
