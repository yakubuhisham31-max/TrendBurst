# Mini Feed - Trending Social Feed App

## Overview

Mini Feed (also known as "Trendz") is a social media platform for creating, sharing, and engaging with trend-based content. Users can host challenges, submit posts, vote on submissions, and participate in competitive rankings. The platform features tailored onboarding for category and role selection, targeting creative individuals and brands.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 22, 2025
- **Create Trend Form Persistence:** Implemented localStorage persistence for Create New Trend page. All form fields are auto-saved as user types, restored on page refresh, and cleared on successful submission.
- **Floating Action Buttons Layout:** Reorganized floating buttons at bottom-right corner with Chat button on top and Post button below for improved user experience.
- **Feed Header UI Improvements:** Fixed Trendz logo centering and back button alignment in post feed header using balanced flex layout. Logo now matches home screen responsive sizing (h-14 sm:h-16 md:h-18).
- **Chat Notification Badge:** Replaced Badge component with custom styled notification indicator for more professional appearance with proper sizing, positioning, and shadow effects.

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