# Mini Feed - Trending Social Feed App

## Overview

Mini Feed (also known as "Trendz") is a social media platform for creating, sharing, and engaging with trend-based content. Users can host challenges, submit posts, vote on submissions, and participate in competitive rankings. The platform features tailored onboarding for category and role selection, targeting creative individuals and brands.

## User Preferences

Preferred communication style: Simple, everyday language.

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