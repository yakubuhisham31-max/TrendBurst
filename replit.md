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

## Recent Changes (November 23, 2025)

### Bug Fixes - Profile Update Issues
1. **Fixed backend undefined values error**: PATCH /api/users/profile now filters out undefined fields before Drizzle ORM, preventing "n is not a function" minified error
2. **Fixed frontend cache invalidation**: Now properly invalidates BOTH cache keys:
   - `/api/auth/user` (for useAuth hook)
   - `/api/users/:username` (for ProfilePage display)
   - This ensures profile changes (pic, bio, social handles) appear immediately without refresh

### Profile Update Flow
The complete flow now works seamlessly:
1. User saves profile changes on EditProfilePage
2. Backend validates and saves to database (200 OK)
3. Frontend invalidates both user caches
4. React Query automatically refetches latest data
5. ProfilePage updates with new profile picture, bio, and social handles
6. No manual refresh needed - changes appear instantly

### Notification Settings Feature
1. **Added notifications preference toggle**: Users can now enable/disable push notifications in EditProfilePage
2. **Database schema updated**: Added `notifications_enabled` field (default: 1) to users table
3. **Backend support**: PATCH /api/users/profile now accepts `notificationsEnabled` parameter to save user preference
4. **Frontend UI**: New "Notifications" card in EditProfilePage with toggle switch, description, and Bell icon
5. **User experience**: Toggle persists across sessions, users can adjust at any time in settings