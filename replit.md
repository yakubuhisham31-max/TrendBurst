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
*   **client/src/App.tsx:** User identification via `OneSignal.login(userId)` - sets external_id
*   **client/src/components/NotificationBell.tsx:** Permission request flow using `OneSignal.Notifications.requestPermission()` with ID tracking
*   **public/OneSignalSDKWorker.js:** Service worker that handles push notifications natively
*   **server/onesignal.ts:** OneSignal REST API client for sending push notifications
*   **server/notificationService.ts:** Notification business logic and database integration
*   **server/routes.ts:** API endpoints for subscription tracking (`POST /api/push/subscribe`, `GET /api/push/subscription`)
*   **server/storage.ts:** Database operations for oneSignalSubscriptions table
*   **shared/schema.ts:** Drizzle schema for oneSignalSubscriptions table

### OneSignal Subscription Tracking

When users enable push notifications, the system captures and stores:
- **userId:** Trendx user ID (primary key)
- **subscriptionId:** OneSignal's unique subscription ID
- **oneSignalUserId:** OneSignal's internal user ID
- **externalId:** Trendx user ID (used for OneSignal targeting)
- **pushToken:** Platform-specific push token
- **isActive:** Flag for active subscriptions
- **timestamps:** Created/updated tracking

This data is stored in the `oneSignalSubscriptions` database table and enables reliable notification delivery using the external_id for targeting.

### OneSignal Configuration

*   **App ID:** 39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9
*   **Safari Web ID:** web.onesignal.auto.511f3fe8-4f38-4cfd-9441-4579acc1dc24
*   **Allowed Domain:** https://trendx.social (production only)
*   **SDK Version:** v16 (native subscription management)
*   **Logo/Branding:** Trendx logo (`/assets/icon.png`) displays in all notifications across Chrome, Android, iOS, and web push notifications
*   **Icon Configuration:**
    - `chrome_web_icon` - Chrome notification icon
    - `large_icon` - Large icon display
    - `big_picture` - Visual banner on Android notifications
    - `ios_attachments` - Image attachment for iOS notifications
    - `chrome_web_badge` - Browser badge icon

### Testing Push Notifications

To test push notifications on https://trendx.social:
1. Sign in to your account
2. Click the notification bell icon in the top right
3. Allow notifications when prompted
4. Check browser console (F12) for subscription confirmation with IDs
5. Trigger a notification event (vote, comment, follow)
6. Notification appears in phone's system notification bar
7. Service worker logs will show: `[OneSignal SW] ✅ Notification displayed successfully`

### Notification Types (18 Total)

**Rank & Competition (6):**
- "You're Climbing! 🔥" - post jumped up rankings
- "You Just Passed Someone 👀🔥" - overtook another post
- "They're Slipping… You're Not 😭🔥" - someone's losing spot
- "They Just Passed You 😭🔥" - someone snatched your spot
- "Someone Just Passed You… AGAIN 😒🔥" - dropped, they climbed
- "You Got Overtaken 👀🔥" - another post jumped ahead

**Achievements (3):**
- "Welcome to Trendx 🔥👋" - new users/notifications enabled
- "🏆 You Dominated the Trend 🏆🔥" - trend winner
- "You Didn't Win… But You Weren't Far 😭🔥" - close second place

**Core Activity (5):**
- "New Post Just Dropped in Your Trend 👀🔥" - for trend hosts
- "A Fresh Post Just Landed 🔥" - new post in trend
- "A New Trend Just Dropped 👀🔥" - trend recommendation
- "This Trend Is Cooking HARD 🔥👀" - trending now
- "Final Hours. No More Excuses 😤🔥" - trend ending soon

**Social & Engagement (4 NEW):**
- "📸✨ Someone You Follow Just Posted!" - followed user posted
- "⚡😤 Trendx Lowkey Missed You…" - inactive user re-engagement
- "🎯👀 You Got Tagged!" - mention/tag notifications
- "🎬💬 Someone Replied to You" - reply notifications

**Creation & Following (4):**
- "Your Post Is Live 🔥" - post creation confirmation
- "Your Trend Is Live 🔥" - trend creation confirmation
- "New Follower 👀🔥" - new follower
- "Your Trend Is Wrapping Up Soon ⏳🔥" - host trend ending

### Recent Updates (Nov 2024)

**OneSignal ID Tracking System:**
- Added `oneSignalSubscriptions` database table to track all subscription IDs
- Implemented subscription capture in NotificationBell component
- Created API endpoints for saving and retrieving subscription data
- Integrated ID tracking into the permission request flow
- System now stores: subscriptionId, oneSignalUserId, pushToken, and externalId
- All IDs are logged to console and persisted in database for reliable notification delivery

**Expanded Notification Types (Nov 23, 2024):**
- Added 4 new notification functions with branded emojis:
  - `sendFollowedUserPostedNotification()` - 30/day rate limit
  - `sendInactiveUserWakeUpNotification()` - 1/day rate limit
  - `sendMentionNotification()` - 20/day rate limit
  - `sendReplyNotification()` - 30/day rate limit
- All notifications include exact emoji combinations for engagement
- Rate limiting configured per notification type for optimal user experience

**Notification Permission Prompt (Nov 23, 2024):**
- Added NotificationPermissionPrompt component that displays on app load
- Shows only once per session and only if permission is "default" (not yet answered)
- Clean modal dialog with friendly explanation and clear call-to-action
- Users can still access permission request anytime from notification bell
- If previously denied, users can still retry from the notification bell
- Improved UX with less intrusive permission request timing

**All 19 Notifications FULLY IMPLEMENTED (Nov 23, 2024):**

**Immediate Notifications (Trigger on user action):**
1. **Welcome** 🔥👋 - User registration
2. **Trend Created** 🔥 - User creates trend
3. **Post Created** 🔥 - User creates post
4. **Rank Gained** 🔥 - Post improves ranking (3 variants)
5. **Rank Lost** 😭🔥 - Post drops ranking (3 variants)
6. **New Follower** 👀🔥 - Someone follows you
7. **Host New Post** 👀🔥 - Someone posts in your trend
8. **Followed User Posted** 📸✨ - Someone you follow posts
9. **Mention** 🎯👀 - Someone mentions you with @username
10. **Reply** 🎬💬 - Someone replies to your comment
11. **Winner** 🏆🔥 - You won the trend
12. **Non-Winner** 😭🔥 - You participated but didn't win
13. **New Trend Recommendation** 👀🔥 - New trend drops (sent to ~10 random users)
14. **Trend Blowing Up** 🔥👀 - Trend gets viral engagement (>50 votes)
15. **Host Trend Ending** ⏳🔥 - Trend you created is ending
16. **You're on a Streak** 🔥💪 - User posts in 3+ different trends within a week (3 message variants)

**Scheduled Notifications (Trigger periodically via endpoints):**
17. **Trend Ending Soon** 😤🔥 - Trend ends in <24 hours (API: POST /api/notifications/scheduled/trend-ending-soon)
18. **Inactive User Wake-Up** ⚡😤 - User hasn't logged in 30 days (API: POST /api/notifications/scheduled/inactive-users)

**Rate Limiting per Notification Type:**
- Rank gained/lost: 5/day
- Followed user posted: 30/day
- Mention: 20/day
- Reply: 30/day
- New follower: 50/day
- Host new post: No limit
- Winner/Non-winner: 50/day
- Post created: 50/day
- Trend created: 50/day
- New trend recommendation: 3/day
- Trend blowing up: 3/day
- You're on a streak: 10/day
- Inactive user wake-up: 1/day
- Host trend ending: 1/day

### Streak Detection Logic (Nov 23, 2024)

**How "You're on a Streak" Works:**
- Triggered when user creates a post
- System checks all user's posts from last 7 days
- Counts unique trends the user has posted in
- If 3 or more trends: Sends streak notification with count
- Rate limited to 10/day to prevent spam on multi-post days
- Features 3 message variants for variety:
  - "You're on a Streak 🔥💪" - Standard recognition
  - "On Fire Right Now 🔥💪" - Momentum-focused
  - "Dominating the Week 🔥💪" - Aggressive take-over message

**Example Triggers:**
- User posts in AI trend → notification not sent (only 1 trend)
- User posts in Entertainment trend → still no notification (2 trends total)
- User posts in Sports trend → sends notification! (3+ trends) 🔥💪
- Each additional post in new trends continues to update the count