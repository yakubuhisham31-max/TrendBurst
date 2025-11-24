# Mini Feed - Trending Social Feed App

## Overview
Mini Feed, or "Trendx", is a social media platform focused on trend-based content. It allows users to create and join challenges, submit posts, vote, and compete in rankings. The platform aims to be a central hub for trending content, targeting creative individuals and brands with a tailored onboarding process.

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
Push notifications are configured for production on `https://trendx.social` using OneSignal v16 SDK. The system has two distinct notification types:

**In-App Notifications:** NotificationBell component displays in-app notifications fetched from the database. Shows unread count and notification list.

**Push Notifications:** Two entry points:
1. PushNotificationButton (manual) - Allows users to explicitly enable browser push notifications
2. NotificationPermissionModal (automatic after signup) - Prompts new users to enable notifications immediately after account creation

When clicked/opened, both:
1. Request browser notification permission
2. Call OneSignal SDK to create a subscription
3. Save subscription to backend (`POST /api/push/subscribe`)
4. Store in `one_signal_subscriptions` table with userId, subscriptionId, externalId (Trendx user ID), pushToken, and isActive status

The backend sends push notifications via OneSignal REST API to users with active subscriptions. Notifications trigger on: new posts, new followers, comments, votes, rankings, and points earned. OneSignal identifies users via `external_id` which maps to the Trendx user ID. The system includes OneSignal SDK initialization in index.html, a service worker for receiving notifications, and server-side OneSignal API client for sending.

### Dark Mode System
Dark mode is implemented using `darkMode: ["class"]` in Tailwind CSS, with CSS variables defined in `:root` and `.dark` classes. A `ThemeProvider` automatically applies the system's dark mode preference (from `prefers-color-scheme: dark`). It prevents flash of unstyled content and ensures full color coverage across all components. Dark mode follows the user's OS setting - no manual toggle required.

### Threaded Comments System (Instagram-style)
Comments now support threaded replies with visual hierarchy:
- Parent comments displayed at full size with avatars and badges
- Replies grouped directly below parent comments with visual indentation
- Left border indicator (blue line) showing the thread structure
- Smaller avatars and text for replies to indicate secondary level
- Reply count badge on parent comments
- Implemented in both PostCommentsDialog and FeedChatPage
- Verification badges and host badges preserved across all comment levels
- Proper sorting: parent comments by newest first, replies by oldest first within each parent

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

### 1. Instagram-Style Threaded Comments
- Implemented proper comment threading in PostCommentsDialog and FeedChatPage
- Parent comments sorted by newest first, replies by oldest first within each thread
- Visual indentation with left border indicators
- Smaller avatars and text for replies
- Reply count badges on parent comments
- Verification badges preserved across all comment levels

### 2. Push Notification Button Improvements
- Fixed "Enable Push" button to handle missing OneSignal gracefully
- Added validation to check if OneSignal SDK is properly initialized before calling
- Clear error messages when OneSignal is not available on dev/test domains
- Production domain restriction clearly communicated to users

### 3. Automatic Notification Permission Modal
- New `NotificationPermissionModal` component prompts users after signup
- Appears automatically after successful account creation
- Users can "Enable Notifications" or "Skip for now"
- Can be enabled anytime from profile settings

### 4. Improved Permission Handling
- Graceful handling of "Permission blocked" errors when user clicks "Block" in browser dialog
- User-friendly messages instead of fatal errors
- Users can retry enabling notifications later
- Both NotificationPermissionModal and PushNotificationButton handle permission denials smoothly
