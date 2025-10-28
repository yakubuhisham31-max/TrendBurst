# Mini Feed - Trending Social Feed App

## Overview

Mini Feed (also referred to as "Trendz" in the UI) is a social media platform where users create trends, share posts, vote on submissions, and engage with the community. The application features a competitive trend-based system where users can host challenges, submit content, and participate in rankings. The platform supports both creative users and brands, with onboarding flows for category selection and role definition.

## Recent Changes

**October 28, 2025:**
- **Authentication & Deployment Fixes for Render:**
  - Fixed static file serving to work correctly in both development and production
  - Updated CORS configuration to support Render, Cloudflare, and Replit preview URLs
  - Added SESSION_SECRET environment variable validation for production
  - Created health check endpoint `/health` for Render monitoring
  - Added comprehensive deployment documentation (`DEPLOYMENT.md`)
  - Created `render.yaml` blueprint for easy Render deployment
  - Created `.env.example` with all required environment variables
  - Installed missing `@types/cors` TypeScript definitions
  - Fixed session cookie configuration for cross-origin authentication
  - All authentication routes (register, login, logout, me) verified working
  - Production build path verified: `client/dist` (not `dist/public`)

**October 23, 2025:**
- **Production Build System for Render Deployment:**
  - Created `build.sh` script that builds frontend first, copies to dist/public, then compiles backend
  - Fixed `InsertTrend` type to use `z.input` (accepts string | Date) for API requests
  - Added endDate transformation in `server/storage.ts` to convert string to Date before database insert
  - Fixed TypeScript errors in NavigationMenu example component
  - Created `server/helpers.ts` with serveStatic and log functions (using __dirname fallback for compatibility)
  - Updated `server/index.ts` to import from helpers instead of vite.ts (avoids vite.config top-level await issues)
  - Build pipeline verified: frontend → dist/public/, backend → dist/index.js (62KB)
  - Created `RENDER_DEPLOYMENT.md` with complete deployment instructions
  - All TypeScript errors resolved (0 LSP diagnostics)
  - Production build tested and working

**October 22, 2025:**
- **TypeScript Build Fixes for Render Deployment:**
  - Created `server/types.ts` to extend Express Session interface with `userId` property
  - Completely rewrote `server/auth.ts` to provide proper helper functions (hashPassword, comparePassword, sanitizeUser, requireAuth)
  - Removed Prisma imports (project uses Drizzle ORM, not Prisma)
  - Restored correct `server/index.ts` from git history (was accidentally replaced with template version)
  - All 54 TypeScript LSP errors resolved initially

**October 10, 2025:**
- **Profile Page User Posts:** Implemented user posts display in Profile page
  - Added `/api/posts/user/:userId` endpoint to fetch posts by user
  - Posts displayed as clickable image thumbnails in grid layout
  - Clicking post thumbnail navigates to trend feed page
  - Shows proper loading skeleton and empty states
- **Button Positioning Fix:** Corrected sticky button positions in FeedPage
  - Chat button now positioned above create post button (bottom-24 vs bottom-6)
  - Both buttons remain sticky in bottom-right corner

**October 7, 2025:**
- **Image Upload System:** Implemented complete image upload functionality using Replit object storage and Uppy file uploader
  - Added ObjectUploader component with modal interface for image uploads
  - Integrated image uploads for profile pictures and post creation
  - Using presigned URLs and ACL policies for secure, direct-to-storage uploads
  - Fixed Uppy CSS loading by using CDN links in index.html
- **Removed Mock Data:** Replaced all placeholder data with real API calls
  - DashboardPage now fetches real user statistics via `/api/dashboard/stats` endpoint
  - RankingsPage fetches actual rankings from `/api/rankings/:id`
  - InstructionsPage displays real trend data from `/api/trends/:id`
  - All pages show proper loading and empty states
- Updated trend status badges (Ended/Ending Soon) to display centered over trend card images with red background styling
- Fixed create post button visibility in feed - now always visible when trend is active (removed userHasPosted condition)
- Modernized FeedChatPage with new layout: trend info card header, cleaner chat messages with avatars, and fixed message input footer

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system

**Design System:**
- Custom color palette with light/dark mode support using CSS variables
- Typography based on Inter font family via Google Fonts
- Consistent spacing scale using Tailwind units
- Component library following modern social platform patterns (Instagram cards, Twitter feed layout, LinkedIn profile structure)
- Elevated card designs with shadow transitions for interactive elements

**Key Frontend Patterns:**
- Component-based architecture with reusable UI components
- Custom hooks for mobile detection and toast notifications
- Form handling with React Hook Form and Zod validation
- Responsive design with mobile-first approach
- Path aliases for clean imports (@/, @shared/, @assets/)

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Build Tool**: Vite for frontend, esbuild for backend bundling
- **Development**: tsx for TypeScript execution

**Storage Interface:**
- Abstract storage interface (IStorage) for CRUD operations
- In-memory storage implementation (MemStorage) for development
- Designed for easy migration to persistent database storage
- User management with username-based authentication

**API Design:**
- RESTful endpoints prefixed with /api
- Request/response logging middleware
- JSON body parsing with Express
- Error handling middleware with status code propagation

### Data Model

**Core Entities:**

1. **Users**
   - Authentication credentials (username, password)
   - Profile information (bio, profile picture)
   - Social stats (followers, following)
   - UUID-based primary keys

2. **Trends**
   - Creator reference to user
   - Trend metadata (name, instructions, rules array)
   - Category classification
   - Engagement metrics (views, participants, chat count)
   - Optional cover picture and end date support

3. **Posts**
   - Belongs to trend and user
   - Media content (image URL)
   - Optional caption
   - Vote count tracking
   - Timestamp for sorting/ranking

4. **Votes**
   - Links posts, users, and trends
   - Prevents duplicate voting
   - Supports ranking calculations

5. **Comments**
   - Supports both post and trend-level discussions
   - Nested reply structure with parent references
   - User attribution and timestamps

**Database Schema Patterns:**
- PostgreSQL with UUID primary keys (gen_random_uuid())
- Foreign key relationships for data integrity
- Text arrays for flexible rule storage
- Timestamp tracking with defaultNow()
- Integer counters with default values

### External Dependencies

**UI Component Libraries:**
- **Radix UI**: Comprehensive set of unstyled, accessible components (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, hover-card, navigation-menu, popover, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, toggle, tooltip)
- **Shadcn/ui**: Pre-configured component patterns built on Radix
- **class-variance-authority**: Type-safe variant handling for components
- **cmdk**: Command palette component

**Utilities:**
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon library
- **react-icons**: Additional social media icons (Instagram, TikTok, X/Twitter, YouTube)
- **clsx & tailwind-merge**: Conditional class name utilities
- **zod**: Schema validation with Drizzle integration (drizzle-zod)

**Database & ORM:**
- **@neondatabase/serverless**: PostgreSQL serverless driver with WebSocket support
- **drizzle-orm**: Type-safe ORM with schema-first approach
- **drizzle-kit**: Migration tooling and schema management

**Development Tools:**
- **Vite**: Frontend build tool with HMR
- **esbuild**: Fast backend bundling
- **tsx**: TypeScript execution for development
- **@replit/vite-plugin-***: Replit-specific development enhancements (runtime error overlay, cartographer, dev banner)

**Authentication & Sessions:**
- **connect-pg-simple**: PostgreSQL session store for Express
- **bcrypt**: Password hashing
- **express-session**: Session middleware with PostgreSQL persistence
- **CORS**: Configured for Replit, Render, and Cloudflare domains

**Form Management:**
- **react-hook-form**: Performant form handling
- **@hookform/resolvers**: Validation resolver integration

**Visualization:**
- **recharts**: Chart components for dashboard analytics

**Carousel:**
- **embla-carousel-react**: Touch-friendly carousel for reference media galleries

**File Upload:**
- **@uppy/core**: File uploader core functionality
- **@uppy/react**: React components for Uppy
- **@uppy/dashboard**: Dashboard UI for file uploads
- **@uppy/aws-s3**: AWS S3 (and compatible services) upload support for Uppy