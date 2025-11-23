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
*   OneSignal