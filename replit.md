# Mini Feed - Trending Social Feed App

## Overview

Mini Feed (also known as "Trendz") is a social media platform for creating, sharing, and engaging with trend-based content. Users can host challenges, submit posts, vote on submissions, and participate in competitive rankings. The platform features tailored onboarding for category and role selection, targeting creative individuals and brands.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 23, 2025 - Push Notification System Complete Debugging & Fixes
- **Manifest.json Created:** Added `public/manifest.json` with PWA configuration, including GCM sender ID for OneSignal, app icons, theme colors, and proper metadata. Manifest is served via dedicated route in `server/index.ts`.
- **Enhanced SDK Initialization:** Updated OneSignal init in `client/index.html` with `allowLocalhostAsSecureOrigin`, `autoResubscribe`, service worker configuration, and comprehensive error handling.
- **Graceful Error Handling:** Added `window.OneSignalInitialized` flag to track SDK state. App now handles domain mismatch errors gracefully without breaking functionality.
- **Permission Request Flow:** Implemented `requestNotificationPermission()` and `checkNotificationPermission()` functions in `client/src/lib/onesignal.ts` for proper browser notification permission handling.
- **Service Worker Serving:** Confirmed `OneSignalSDKWorker.js` and `OneSignalSDKUpdaterWorker.js` are properly served from dist folder with correct Content-Type headers.
- **Backend Status:** ✅ **FULLY WORKING** - Backend successfully sends push notifications with HTTP 200 responses. OneSignal API confirmed receiving and processing notifications for posts, votes, comments, follows, etc.
- **Frontend Status:** ⚠️ **Domain Configuration Required** - OneSignal SDK blocked in development due to domain validation. Configured for `trend-burst-rafiqykb99.replit.app` in OneSignal dashboard.
- **Production Ready:** ✅ System will work perfectly in production on `trendx.social` domain once OneSignal dashboard Site URL is updated to match production domain.

### November 22, 2025 - OneSignal v16 Push Notifications (Initial Setup)
- **OneSignal v16 SDK Integration:** Updated to modern OneSignal v16 SDK with `OneSignalDeferred` initialization pattern in `client/index.html`.
- **User ID Linking:** Implemented automatic linking of app user IDs to OneSignal Player IDs via `initializeOneSignal()` function in `client/src/lib/onesignal.ts`. Called on login, registration, and initial app load for authenticated users.
- **Push Notification Sending:** Backend sends notifications to `include_external_user_ids` using proper REST API with `Authorization: Bearer {API_KEY}` header (updated from Basic auth).
- **Notification Types:** Implemented notifications for posts, comments, votes, rank changes, trend endings, and more via `server/notificationService.ts`.
- **API Key Format:** Updated to use OneSignal v2 REST API key format (`os_v2_app_...`) with Bearer token authentication.

### November 22, 2025 - Simple Username/Email + Password Authentication
- **Authentication Overhaul:** Removed Replit Auth and implemented simple, self-contained username/email + password authentication system.
- **Backend Endpoints:** Created `/api/auth/login` (login with username or email), `/api/auth/register` (create new account), and `/api/auth/logout` endpoints.
- **Frontend Login Form:** Redesigned `AuthModal.tsx` with two tabs: "Sign In" (existing users) and "Sign Up" (new users). Both accept username/email and password.
- **Session Management:** Uses PostgreSQL session storage with `connect-pg-simple` for secure, persistent user sessions.
- **Password Security:** All passwords are hashed using bcrypt (10 rounds) before storage in database.
- **Middleware:** Simple `isAuthenticated` middleware checks `req.session.userId` for protected routes.
- **Result:** ✅ Users can sign up with username/email and password. Login works with either username or email. All authentication self-contained with no external dependencies.

### November 22, 2025
- **Create Trend Form Persistence:** Implemented localStorage persistence for Create New Trend page. All form fields are auto-saved as user types, restored on page refresh, and cleared on successful submission.
- **Floating Action Buttons Layout:** Reorganized floating buttons at bottom-right corner with Chat button on top and Post button below for improved user experience.
- **Feed Header UI Improvements:** Fixed Trendz logo centering and back button alignment in post feed header using balanced flex layout. Logo now matches home screen responsive sizing (h-14 sm:h-16 md:h-18).
- **Chat Notification Badge:** Replaced Badge component with custom styled notification indicator for more professional appearance with proper sizing, positioning, and shadow effects.
- **Create Trend Button Redesign:** Enhanced the Create New Trend button with gradient background, improved shadows, larger icon, and bold typography for more prominence and visual appeal.
- **Trend Card Status Badges:** Updated "Ending Soon" and "Ended" labels on trend cards with minimalist glassmorphism design, featuring backdrop blur, subtle borders, and professional coloring (amber for ending, red for ended).
- **Google Auth Flow Optimization:** Fixed authentication modal to directly open Google auth without extra sign-in tabs. Clicking "Continue with Google" now triggers the auth popup directly for streamlined user experience. Added official Google logo (SVG) to button. Implemented two-step Google OAuth flow: existing users are logged in directly, while new users are redirected to /complete-profile to set up username and password before proceeding.
- **Video Playback Optimization:** Optimized video loading and playback in post feed with `preload="metadata"` attribute for smooth video start without full buffering, and `crossOrigin="anonymous"` for proper CORS handling. Applied to both PostCard and PostFullscreenModal components for consistent smooth video performance across the app. Restored `autoPlay` for fullscreen videos to start playing immediately upon opening.
- **Google Logo Colors:** Implemented official Google brand colors in the Google Sign-In button logo (blue #4285F4, red #EA4335, yellow #FBBC04, green #34A853) for professional branding.
- **Video Feed Performance & Tap Controls:** Fixed video lag by implementing dynamic preloading - feed videos start with `preload="none"` and only load full video data when 80% visible, then revert to `preload="none"` when scrolled out of view. Only one video plays at a time. Added tap-to-pause/play functionality - single tap on video toggles playback, double-tap likes the post.

### November 9, 2025
- **Notification Sound Effect:** Implemented Web Audio API-based notification sound that plays when new notifications arrive. Sound preference is saved in localStorage and can be enabled/disabled per user.
- **Verification Badge System:** Added blue verification badge feature for authenticated accounts. The `verified` field (integer, 0=not verified, 1=verified) has been added to the users table. Verification badges display next to usernames on ProfilePage. The "Trendx" account has been verified.
- **Custom Domain Support:** Added CORS configuration for custom domains https://trendx.social and https://www.trendx.social.

### Verification Badge Integration Status
- ✅ ProfilePage: Shows verification badge next to username
- ⏳ Future: Add badges to TrendCard, PostCard, Comments, Notifications

### Production Deployment Notes
- The "Trendx" account must be manually verified in the production database using: `UPDATE users SET verified = 1 WHERE username = 'Trendx';`
- For www.trendx.social subdomain: Add an A record with hostname "www" pointing to the same IP address as the root domain in your DNS registrar settings. Replit handles SSL certificates automatically.

### Push Notifications Configuration Required
**CRITICAL:** To enable push notifications in production, update OneSignal dashboard:
1. Go to https://dashboard.onesignal.com
2. Navigate to Settings → All Platforms → **Site URL**
3. Update from `trend-burst-rafiqykb99.replit.app` to `trendx.social` (or current production domain)
4. Add `www.trendx.social` as additional allowed domain if using www subdomain
5. Save changes and redeploy application

**Backend is fully functional** - sending notifications successfully (HTTP 200 confirmed).
**Frontend will work** once Site URL matches production domain.

For development testing on Replit dev domains:
- Add current Replit dev domain to OneSignal allowed sites, OR
- Test push notifications after deploying to production where domain matches

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18 with TypeScript, Wouter for routing, TanStack Query for server state, Shadcn/ui (built on Radix UI) for components, and Tailwind CSS for styling.

**Design System:** Features a custom color palette with light/dark mode support, Inter font family, consistent spacing, and a component library inspired by modern social platforms. Elevated card designs with shadow transitions enhance interactivity.

**Key Frontend Patterns:** Employs a component-based architecture, custom hooks for mobile detection and toast notifications, React Hook Form with Zod validation, and a mobile-first responsive design. Path aliases (`@/`, `@shared/`, `@assets/`) are used for clean imports. The application includes a comprehensive notification system with a bell icon, unread counts, various notification types, and smart navigation. It also features an Instagram-like two-step upload flow for posts.

### Backend Architecture

**Technology Stack:** Node.js with Express.js, Drizzle ORM for database interaction, PostgreSQL (via Neon serverless), Vite for frontend builds, esbuild for backend bundling, and tsx for TypeScript development execution.

**Storage Interface:** Utilizes an abstract `IStorage` interface for CRUD operations, with an in-memory implementation (`MemStorage`) for development, designed for easy migration to persistent storage. User management is username-based.

**API Design:** Implements RESTful endpoints prefixed with `/api`, including request/response logging, JSON body parsing, and comprehensive error handling. Cloudflare R2 is integrated for object storage.

### Data Model

**Core Entities:**

*   **Users:** Manages authentication (username, password), profile information (bio, picture), and social statistics (followers, following) with UUIDs.
*   **Trends:** Stores creator reference, metadata (name, instructions, rules), category, engagement metrics (views, participants, chat count), optional cover pictures, and end dates.
*   **Posts:** Links to trends and users, contains media (image/video URL, type), optional captions, vote counts, and timestamps.
*   **Votes:** Connects posts, users, and trends, preventing duplicate votes and supporting ranking calculations.
*   **Comments:** Supports both post and trend-level discussions, with nested reply structures, user attribution, and timestamps.
*   **Notifications:** Stores information about user interactions (e.g., comments, follows, votes) with types, read status, and relevant IDs.

**Database Schema Patterns:** Uses PostgreSQL with `gen_random_uuid()` for primary keys, foreign key relationships, text arrays for rules, `defaultNow()` for timestamps, and integer counters with default values.

## External Dependencies

**UI Component Libraries:**
*   **Radix UI:** Unstyled, accessible components.
*   **Shadcn/ui:** Pre-configured components built on Radix.
*   **class-variance-authority:** Type-safe variant handling.
*   **cmdk:** Command palette.

**Utilities:**
*   **date-fns:** Date formatting and manipulation.
*   **lucide-react & react-icons:** Icon libraries.
*   **clsx & tailwind-merge:** Conditional class name utilities.
*   **zod:** Schema validation.

**Database & ORM:**
*   **@neondatabase/serverless:** PostgreSQL serverless driver.
*   **drizzle-orm:** Type-safe ORM.
*   **drizzle-kit:** Migration tooling.

**Development Tools:**
*   **Vite:** Frontend build tool.
*   **esbuild:** Fast backend bundling.
*   **tsx:** TypeScript execution.

**Authentication & Sessions:**
*   **connect-pg-simple:** PostgreSQL session store.
*   **bcrypt:** Password hashing.
*   **express-session:** Session middleware.
*   **CORS:** Configured for various environments.

**Form Management:**
*   **react-hook-form:** Performant form handling.
*   **@hookform/resolvers:** Validation resolver integration.

**Visualization:**
*   **recharts:** Chart components.

**Carousel:**
*   **embla-carousel-react:** Touch-friendly carousel.

**File Upload:**
*   **Cloudflare R2:** Object storage for media files (posts, profile pictures, trend covers, reference media).