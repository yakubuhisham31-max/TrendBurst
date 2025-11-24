# Mini Feed - Trending Social Feed App

## Overview
Mini Feed, or "Trendz", is a social media platform focused on trend-based content. It allows users to create and join challenges, submit posts, vote, and compete in rankings. The platform aims to be a central hub for trending content, targeting creative individuals and brands with a tailored onboarding process.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, Wouter for routing, TanStack Query for state management, Shadcn/ui (Radix UI) for components, and Tailwind CSS for styling. It features a custom color palette with full light/dark mode support, Inter font, and a mobile-first responsive design. Key patterns include component-based architecture, custom hooks, React Hook Form with Zod validation, and path aliases. It includes a notification system, an Instagram-like two-step upload flow, optimized video playback, and theme persistence via localStorage.

### Backend
The backend is built with Node.js and Express.js, using Drizzle ORM for PostgreSQL (via Neon serverless). Vite handles frontend builds, esbuild for backend bundling, and tsx for TypeScript development. It provides a RESTful API with request/response logging, JSON parsing, and error handling. Cloudflare R2 is used for object storage. Authentication is self-contained with bcrypt hashing and PostgreSQL session storage.

### Data Model
The core data model includes Users, Trends, Posts, Votes, Comments, and Notifications. The PostgreSQL schema uses UUIDs, foreign keys, text arrays, and timestamps.

### Push Notification System
Push notifications are configured for production on `https://trendx.social` using OneSignal v16 SDK. It identifies users via `external_id`, requests permissions, and creates subscriptions automatically. The backend sends notifications via the OneSignal REST API. Notifications appear as system notifications with Trendz branding. Key components include client-side SDK initialization, a NotificationBell component, a service worker, and a custom OneSignal REST API client on the server. The system tracks `oneSignalSubscriptions` in the database, storing `userId`, `subscriptionId`, `oneSignalUserId`, `externalId`, `pushToken`, and `isActive` status.

### Dark Mode System
Dark mode is implemented using `darkMode: ["class"]` in Tailwind CSS, with CSS variables defined in `:root` and `.dark` classes. A `ThemeProvider` automatically applies the system's dark mode preference (from `prefers-color-scheme: dark`). It prevents flash of unstyled content and ensures full color coverage across all components. Dark mode follows the user's OS setting - no manual toggle required.

## External Dependencies

**UI Component Libraries:**
*   Radix UI
*   Shadcn/ui
*   class-variance-authority
*   cmdk

**Utilities:**
*   date-fns
*   lucide-react & react-icons
*   clsx & tailwind-merge
*   zod

**Database & ORM:**
*   @neondatabase/serverless (PostgreSQL)
*   drizzle-orm
*   drizzle-kit

**Development Tools:**
*   Vite
*   esbuild
*   tsx

**Authentication & Sessions:**
*   connect-pg-simple
*   bcrypt
*   express-session
*   CORS

**Form Management:**
*   react-hook-form
*   @hookform/resolvers

**Visualization:**
*   recharts

**Carousel:**
*   embla-carousel-react

**File Upload:**
*   Cloudflare R2

**Push Notifications:**
*   OneSignal (v16 SDK)

## Recent Changes (November 24, 2025)

### Complete Push Notification System Removal
Successfully removed entire OneSignal push notification integration and restored codebase to pre-push-notification state:

1. **Frontend Cleanup**:
   - Removed OneSignal SDK script tag from client/index.html
   - Removed OneSignalSDKWorker.js and OneSignalSDKUpdaterWorker.js from public directory
   - Removed NotificationBell component import and usage from HomePage
   - Removed OneSignal initialization imports from AuthContext
   - Removed initializeOneSignal() calls from login/register flows

2. **Backend Cleanup**:
   - Removed all 12+ notificationService calls from server/routes.ts
   - Removed notificationService imports
   - Removed sendPushNotification function calls throughout routes
   - Removed orphaned push notification parameter blocks
   - Kept database notification storage intact for in-app notifications

3. **Build & Deployment**:
   - Fixed all syntax errors from cleanup process
   - Build passes successfully without warnings
   - App running stably on port 5000
   - All API endpoints functional
   - Database connections working properly

4. **What Remains**:
   - In-app notifications still functional via storage.createNotification()
   - Notification database tables intact
   - Notification UI components available for in-app use
   - Push notification infrastructure fully removed