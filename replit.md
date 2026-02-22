# Mini Feed - Trending Social Feed App

## Overview
Mini Feed, or "Trendx", is a social media platform centered on trend-based content. It enables users to create and join challenges, submit posts, vote, and compete in rankings. The platform's primary goal is to serve as a central hub for trending content, attracting creative individuals and brands through a specialized onboarding process.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (February 20, 2026)
- **Production Deployment Fixes:** Targeted fixes for production inconsistencies
  - View counts now unique per user per trend (no duplicate increments)
  - Comment/chat counts update in real-time via DB increment/decrement on create/delete
  - Rankings exclude disqualified posts (isDisqualified=0 filter)
  - Welcome email sent on signup (not "account verified" email); verification badge email remains admin-only
  - Auto-refresh: staleTime=30s, refetchOnWindowFocus=true, predicate-based cache invalidation
  - OneSignal workers confirmed in Vite build output (publicDir → dist)
  - Notification badge has 60s refetchInterval

## Previous Updates (December 8, 2025)
- **Email System Upgraded:** Switched from SendGrid to Brevo for email delivery
  - Brevo API integration fully configured with BREVO_API_KEY
  - OTP emails sent automatically during signup verification
  - Welcome email sent after OTP verification (email confirmed)
  - Verification badge email system: Call `PATCH /api/users/{userId}/verify` to send badge confirmation
  - Sender email: `trendx.social1@gmail.com` (verified in Brevo)
- **OTP Email Verification:** Secure 6-digit OTP-based email verification for signup
  - Users receive OTP codes via email (10-minute expiration)
  - Database table: `emailVerificationCodes` tracks codes with expiry
  - Backend routes: `/api/auth/send-otp` and `/api/auth/verify-otp`
  - Frontend: OTP verification screen appears after signup, validates code before account creation
- **Verification Badge Emails:** When users receive verification badges
  - Manual workflow: Update `verified` field from 0 to 1 in production database
  - Then call `PATCH /api/users/{userId}/verify` to send verification badge confirmation email
  - Email includes personalized congratulations and badge notification
- **Deployment Fixed:** Updated to Autoscale deployment target with dynamic PORT environment variable support
- **Notifications Reference:** Documented all 20+ push notification types with daily rate limits

## Previous Updates (November 25, 2025)
- **UI Improvements:** Long username handling with truncate + tooltip across comments, chat, sidebar, and analytics
- **Analytics Enhancements:** Added play button overlay on video thumbnails, smart navigation tracking
- **Navigation Fixes:** Back button reliability across ranking, chat, and fullscreen views

## System Architecture

### Frontend
The frontend utilizes React 18, TypeScript, Wouter for routing, TanStack Query for state management, Shadcn/ui (Radix UI) for components, and Tailwind CSS for styling. It features a custom color palette with full light/dark mode support, Inter font, and a mobile-first responsive design. Key patterns include component-based architecture, custom hooks, React Hook Form with Zod validation, and path aliases. It includes a notification system, an Instagram-like two-step upload flow, optimized video playback, and theme persistence via localStorage. Dark mode is implemented using `darkMode: ["class"]` in Tailwind CSS, applying system preferences and preventing flash of unstyled content.

### Backend
The backend is built with Node.js and Express.js, using Drizzle ORM for PostgreSQL (via Neon serverless). Vite handles frontend builds, esbuild for backend bundling, and tsx for TypeScript development. It provides a RESTful API with request/response logging, JSON parsing, and error handling. Cloudflare R2 is used for object storage. Authentication is self-contained with bcrypt hashing and PostgreSQL session storage. Email delivery uses Brevo API for OTP verification and user notifications.

### Data Model
The core data model includes Users, Trends, Posts, Votes, Comments, and Notifications. The PostgreSQL schema uses UUIDs, foreign keys, text arrays, and timestamps. The Users table includes a `verified` field (integer, default 0) for verification badge status.

### Push Notification System
Push notifications are configured for production on `https://trendx.social` using OneSignal v16 SDK. In-app notifications are displayed via a NotificationBell component. Push notifications are enabled via an automatic `NotificationPermissionModal` after signup, which requests browser permission, calls the OneSignal SDK, and saves the subscription to the backend. The backend sends notifications via the OneSignal REST API for events like new posts, followers, comments, votes, rankings, and points earned, identifying users via `external_id` mapped to the Trendx user ID.

### Email System (Brevo)
The email system uses Brevo API for reliable email delivery:
- **OTP Emails:** Sent automatically when users sign up with a 6-digit verification code
- **Account Verified Email:** Sent after successful OTP verification
- **Verification Badge Email:** Sent when users receive their verification badge
- Configuration: `BREVO_API_KEY` environment variable, sender email: `trendx.social1@gmail.com`

### Threaded Comments System (Instagram-style with Nested Replies)
Comments support unlimited nested threaded replies with a visual hierarchy. This includes recursive threading, progressively smaller text/avatars for deeper replies, indentation with border indicators, and smart sorting (parent comments by newest, replies by oldest). Reply counts and full badge support are preserved across all nesting levels. This system is implemented in both `PostCommentsDialog` and `FeedChatPage` using recursive components (`CommentThread` and `ChatCommentThread`). All replies are hidden by default with a "Show X replies" / "Hide X replies" toggle for visibility control.

### Trend Management & Analytics
Trend creators access comprehensive analytics from their **Dashboard** showing posts, votes, comments, unique participants, and engagement metrics via professional Recharts visualizations. Each trend card in the Dashboard has an **Analytics** button that navigates to a dedicated analytics page with:
- **Engagement Breakdown:** Donut chart with percentages showing votes vs comments breakdown with custom legend
- **Votes Distribution:** Bar chart with rounded corners, custom tooltips, and username labels showing top post performance
- **Top Posts List:** Compact row-based list with small media thumbnails (images/videos), vote counts, and contributor usernames. Video thumbnails display a play button overlay icon. Clicking any top post opens it in fullscreen on the feed and returns to analytics when closing
- **Performance Metrics:** Cards displaying total posts, votes, comments, participants, and engagement rate
- **Smart Navigation:** Clicking on analytics top posts saves the origin and allows the back button in fullscreen view to return directly to analytics instead of the feed

Trend hosts can disqualify users and delete posts, which permanently prevents users from re-entering that specific trend. Disqualified users see the "Create Post" button hidden for those trends. Disqualification actions trigger push and in-app notifications to the affected user.

### User Profile
The user profile features an improved "Saved" section with sub-tabs to separate saved trends and saved posts, each with a count badge and appropriate grid layouts (2-column for trends, 3-column for posts). Users with `verified: 1` display a verification badge on their profile.

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

**Email Delivery:**
*   Brevo API (REST)
