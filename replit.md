# Mini Feed - Trending Social Feed App

## Overview
Mini Feed (also known as "Trendz") is a social media platform designed for creating, sharing, and engaging with trend-based content. It enables users to host challenges, submit posts, vote on submissions, and participate in competitive rankings. The platform features tailored onboarding for category and role selection, targeting creative individuals and brands, with the ambition to become a leading hub for trending content.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, Wouter for routing, TanStack Query for server state management, Shadcn/ui (based on Radix UI) for components, and Tailwind CSS for styling. It features a custom color palette, light/dark mode support, Inter font family, and a mobile-first responsive design. Key patterns include a component-based architecture, custom hooks, React Hook Form with Zod validation, and path aliases. The application includes a comprehensive notification system, an Instagram-like two-step upload flow, and optimized video playback with dynamic preloading and tap controls.

### Backend Architecture
The backend uses Node.js with Express.js, Drizzle ORM for PostgreSQL interaction (via Neon serverless), Vite for frontend builds, esbuild for backend bundling, and tsx for TypeScript development. It features a RESTful API with `/api` prefix, request/response logging, JSON body parsing, and comprehensive error handling. Cloudflare R2 is integrated for object storage. Authentication is self-contained, using username/email and password with bcrypt hashing and PostgreSQL session storage.

### Data Model
The core data model includes:
*   **Users:** For authentication, profile information, and social statistics.
*   **Trends:** Stores trend metadata, creator references, engagement metrics, and end dates.
*   **Posts:** Links to trends and users, containing media, captions, and vote counts.
*   **Votes:** Connects posts, users, and trends, supporting ranking.
*   **Comments:** For post and trend discussions, including nested replies.
*   **Notifications:** Records user interactions with types, read status, and relevant IDs.
The database schema utilizes PostgreSQL with UUID primary keys, foreign key relationships, text arrays, and default timestamps.

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

## Push Notification System

### Production-Only Setup
Push notifications are configured to work **only on the production domain: https://trendx.social**. This is intentional for security and proper OneSignal app configuration.

**Important:** When testing on development domains (Replit preview URLs), OneSignal SDK will fail to initialize with error: "Can only be used on: https://trendx.social". This is expected behavior.

### How It Works

1. **User Identification:** When users log in, their Trendx user ID is automatically linked to OneSignal as an external_id
2. **Permission Request:** When users click the notification bell for the first time, they're prompted to allow push notifications
3. **Subscription Creation:** OneSignal v16 SDK automatically creates the push subscription (no manual VAPID keys needed)
4. **Backend Delivery:** Server sends notifications via OneSignal REST API using `include_external_user_ids` targeting Trendx user IDs
5. **System Notifications:** Notifications appear in the phone's system notification bar with Trendz branding

### Key Components

*   **client/index.html:** OneSignal SDK initialization with app configuration
*   **client/src/App.tsx:** User identification via `OneSignal.login(userId)`
*   **client/src/components/NotificationBell.tsx:** Permission request flow using `OneSignal.Notifications.requestPermission()`
*   **public/OneSignalSDKWorker.js:** Service worker that handles push notifications natively
*   **server/onesignal.ts:** OneSignal REST API client for sending push notifications
*   **server/notificationService.ts:** Notification business logic and database integration

### OneSignal Configuration

*   **App ID:** 39eb07fa-42bb-4d9d-86bb-87ebbd5e39b9
*   **Safari Web ID:** web.onesignal.auto.511f3fe8-4f38-4cfd-9441-4579acc1dc24
*   **Allowed Domain:** https://trendx.social (production only)
*   **SDK Version:** v16 (native subscription management)

### Testing Push Notifications

To test push notifications, you must deploy to production (https://trendx.social):
1. Sign in to your account
2. Click the notification bell icon
3. Allow notifications when prompted
4. Check browser console for subscription status (should show assigned IDs)
5. Trigger a notification event (vote, comment, follow)
6. Notification appears in phone's system notification bar