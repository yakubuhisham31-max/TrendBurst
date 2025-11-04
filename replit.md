# Mini Feed - Trending Social Feed App

## Overview

Mini Feed (also known as "Trendz") is a social media platform designed for creating, sharing, and engaging with trend-based content. Users can host challenges, submit posts, vote on submissions, and participate in competitive rankings. The platform caters to both creative individuals and brands, featuring tailored onboarding processes for category and role selection.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 4, 2025 - Cloudflare R2 Storage Integration & Upload Fixes:**
- **Object Storage Migration:**
  - Replaced Google Cloud Storage with Cloudflare R2 for all file uploads
  - Configured AWS SDK S3 client to connect to R2 endpoint
  - Created R2StorageService for generating presigned upload URLs
  - All uploads now store files in the trendx-media R2 bucket

- **Upload Endpoints Updated:**
  - `/api/objects/upload`: Generates presigned URLs for post media (images/videos)
  - `/api/object-storage/upload-url`: Generates presigned URLs for custom paths (trend covers, profile pictures, reference media)
  - Both endpoints return uploadURL (for upload) and publicURL (for access)
  - Public URLs use R2_PUBLIC_DOMAIN environment variable for proper accessibility

- **Frontend Upload Handlers:**
  - Fixed race condition: Changed from useState to useRef for storing public URLs
  - Ensures public URL is immediately available when upload completes
  - Resolves "failed to get upload URL" error that prevented uploads from displaying
  - Updated CreatePostDialog to use R2 for post media uploads
  - Updated EditProfilePage to use R2 for profile picture uploads
  - Updated CreateTrendPage to use R2 for trend covers and reference media
  - All handlers now save R2 public URLs to database

- **Security & Configuration:**
  - R2 credentials stored as environment secrets (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN)
  - Presigned URLs expire after 15 minutes for security
  - Path sanitization prevents directory traversal attacks
  - CORS configuration required on R2 bucket for browser uploads

**November 3, 2025 - View Tracking and Participant Count Updates:**
- **View Tracking on Trend Cards:**
  - Added automatic view tracking when users click/tap on trend cards
  - View tracking records one view per user per trend (prevents duplicate counting)
  - Tracks views via POST `/api/trends/:id/view` endpoint
  - Updates view counts in real-time with proper cache invalidation

- **Participant Count Redefined:**
  - Changed `participants` field from "unique users" to "total posts count"
  - Increments when a user creates a post in a trend
  - Decrements when a user deletes a post from a trend
  - Added `incrementTrendParticipants()` and `decrementTrendParticipants()` methods to storage interface
  - Provides accurate count of all submissions in each trend

- **Cache Invalidation Improvements:**
  - Updated TrendCard mutations to use predicate-based cache invalidation
  - Ensures all trend-related queries refresh after view/participant changes
  - Supports category-filtered queries and general trend listings

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18 with TypeScript, Wouter for routing, TanStack Query for server state, Shadcn/ui (built on Radix UI) for components, and Tailwind CSS for styling.

**Design System:** Features a custom color palette with light/dark mode support, Inter font family, consistent spacing, and a component library inspired by modern social platforms. Elevated card designs with shadow transitions enhance interactivity.

**Key Frontend Patterns:** Employs a component-based architecture, custom hooks for mobile detection and toast notifications, React Hook Form with Zod validation, and a mobile-first responsive design. Path aliases (`@/`, `@shared/`, `@assets/`) are used for clean imports.

### Backend Architecture

**Technology Stack:** Node.js with Express.js, Drizzle ORM for database interaction, PostgreSQL (via Neon serverless), Vite for frontend builds, esbuild for backend bundling, and tsx for TypeScript development execution.

**Storage Interface:** Utilizes an abstract `IStorage` interface for CRUD operations, with an in-memory implementation (`MemStorage`) for development, designed for easy migration to persistent storage. User management is username-based.

**API Design:** Implements RESTful endpoints prefixed with `/api`, including request/response logging, JSON body parsing, and comprehensive error handling.

### Data Model

**Core Entities:**

*   **Users:** Manages authentication (username, password), profile information (bio, picture), and social statistics (followers, following) with UUIDs.
*   **Trends:** Stores creator reference, metadata (name, instructions, rules), category, engagement metrics (views, participants, chat count), optional cover pictures, and end dates.
*   **Posts:** Links to trends and users, contains media (image/video URL, type), optional captions, vote counts, and timestamps.
*   **Votes:** Connects posts, users, and trends, preventing duplicate votes and supporting ranking calculations.
*   **Comments:** Supports both post and trend-level discussions, with nested reply structures, user attribution, and timestamps.

**Database Schema Patterns:** Uses PostgreSQL with `gen_random_uuid()` for primary keys, foreign key relationships, text arrays for rules, `defaultNow()` for timestamps, and integer counters with default values.

## External Dependencies

**UI Component Libraries:**
*   **Radix UI:** Unstyled, accessible components (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, hover-card, navigation-menu, popover, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, toggle, tooltip).
*   **Shadcn/ui:** Pre-configured components built on Radix.
*   **class-variance-authority:** Type-safe variant handling.
*   **cmdk:** Command palette.

**Utilities:**
*   **date-fns:** Date formatting and manipulation.
*   **lucide-react & react-icons:** Icon libraries.
*   **clsx & tailwind-merge:** Conditional class name utilities.
*   **zod:** Schema validation with Drizzle integration.

**Database & ORM:**
*   **@neondatabase/serverless:** PostgreSQL serverless driver.
*   **drizzle-orm:** Type-safe ORM.
*   **drizzle-kit:** Migration tooling.

**Development Tools:**
*   **Vite:** Frontend build tool.
*   **esbuild:** Fast backend bundling.
*   **tsx:** TypeScript execution.
*   **@replit/vite-plugin-***: Replit-specific development enhancements.

**Authentication & Sessions:**
*   **connect-pg-simple:** PostgreSQL session store.
*   **bcrypt:** Password hashing.
*   **express-session:** Session middleware.
*   **CORS:** Configured for Replit, Render, and Cloudflare.

**Form Management:**
*   **react-hook-form:** Performant form handling.
*   **@hookform/resolvers:** Validation resolver integration.

**Visualization:**
*   **recharts:** Chart components for dashboard analytics.

**Carousel:**
*   **embla-carousel-react:** Touch-friendly carousel.

**File Upload:**
*   **@uppy/core & @uppy/react:** File uploader core and React components.
*   **@uppy/dashboard:** Dashboard UI for file uploads.
*   **@uppy/aws-s3:** AWS S3 compatible upload support.