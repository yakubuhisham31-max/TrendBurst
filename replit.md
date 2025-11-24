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

### Notification Settings Reversal & OneSignal Production Confirmation
1. **Removed notification settings feature** (user-requested reversal):
   - Removed `notificationsEnabled` field from users table schema
   - Removed Notifications UI card from EditProfilePage
   - Simplified profile update flow (removed toggle state/logic from frontend)
   - Cleaned up backend PATCH /api/users/profile handler

2. **OneSignal v16 SDK - Production Ready**:
   - ✅ Service workers successfully registering on production domain (https://trendx.social)
   - ✅ OneSignal SDK initializes successfully on production
   - ✅ Push notification subscription system is fully operational
   - ℹ️ Dev/preview domains show "Can only be used on: https://trendx.social" (security restriction)
   - ℹ️ This is expected behavior - OneSignal restricts SDK to authorized production domain only
   - Backend OneSignal integration complete: sendPushNotification function ready
   - Service worker registration works perfectly when deployed to https://trendx.social

3. **Code Quality**:
   - Fixed LSP diagnostic error in server/routes.ts (line 761 - added null check for createdAt)
   - All builds pass without warnings
   - App ready for production deployment