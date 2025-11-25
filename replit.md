# Mini Feed - Trending Social Feed App

## Overview
Mini Feed, or "Trendx", is a social media platform centered on trend-based content. It enables users to create and join challenges, submit posts, vote, and compete in rankings. The platform's primary goal is to serve as a central hub for trending content, attracting creative individuals and brands through a specialized onboarding process.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend utilizes React 18, TypeScript, Wouter for routing, TanStack Query for state management, Shadcn/ui (Radix UI) for components, and Tailwind CSS for styling. It features a custom color palette with full light/dark mode support, Inter font, and a mobile-first responsive design. Key patterns include component-based architecture, custom hooks, React Hook Form with Zod validation, and path aliases. It includes a notification system, an Instagram-like two-step upload flow, optimized video playback, and theme persistence via localStorage. Dark mode is implemented using `darkMode: ["class"]` in Tailwind CSS, applying system preferences and preventing flash of unstyled content.

### Backend
The backend is built with Node.js and Express.js, using Drizzle ORM for PostgreSQL (via Neon serverless). Vite handles frontend builds, esbuild for backend bundling, and tsx for TypeScript development. It provides a RESTful API with request/response logging, JSON parsing, and error handling. Cloudflare R2 is used for object storage. Authentication is self-contained with bcrypt hashing and PostgreSQL session storage.

### Data Model
The core data model includes Users, Trends, Posts, Votes, Comments, and Notifications. The PostgreSQL schema uses UUIDs, foreign keys, text arrays, and timestamps.

### Push Notification System
Push notifications are configured for production on `https://trendx.social` using OneSignal v16 SDK. In-app notifications are displayed via a NotificationBell component. Push notifications are enabled via an automatic `NotificationPermissionModal` after signup, which requests browser permission, calls the OneSignal SDK, and saves the subscription to the backend. The backend sends notifications via the OneSignal REST API for events like new posts, followers, comments, votes, rankings, and points earned, identifying users via `external_id` mapped to the Trendx user ID.

### Threaded Comments System (Instagram-style with Nested Replies)
Comments support unlimited nested threaded replies with a visual hierarchy. This includes recursive threading, progressively smaller text/avatars for deeper replies, indentation with border indicators, and smart sorting (parent comments by newest, replies by oldest). Reply counts and full badge support are preserved across all nesting levels. This system is implemented in both `PostCommentsDialog` and `FeedChatPage` using recursive components (`CommentThread` and `ChatCommentThread`). All replies are hidden by default with a "Show X replies" / "Hide X replies" toggle for visibility control.

### Trend Management
Trend creators have access to an analytics dashboard showing posts, votes, comments, unique participants, and engagement metrics. Trend hosts can disqualify users and delete posts, which permanently prevents users from re-entering that specific trend. Disqualification actions trigger push and in-app notifications to the affected user.

### User Profile
The user profile features an improved "Saved" section with sub-tabs to separate saved trends and saved posts, each with a count badge and appropriate grid layouts (2-column for trends, 3-column for posts).

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