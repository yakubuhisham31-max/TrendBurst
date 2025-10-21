# Mini Feed - Trending Social Feed App

## Overview

Mini Feed (also referred to as "Trendz" in the UI) is a social media platform where users create trends, share posts, vote on submissions, and engage with the community. The application features a competitive trend-based system where users can host challenges, submit content, and participate in rankings. The platform supports both creative users and brands, with onboarding flows for category selection and role definition.

## Recent Changes

**October 21, 2025:**
- **Reference Media Enhancement:** Extended reference media support in Create Trend
  - Increased limit from 1 to 3 reference media uploads per trend
  - Added support for both images and videos in reference media
  - Implemented proper file extension detection based on MIME type and filename
  - Updated ObjectUploader to pass file metadata (name, type, size) to upload handlers
  - All upload handlers now generate filenames with correct extensions (.jpg, .png, .mp4, .webm, .mov)
  - Fixed video rendering across CreateTrendPage, InstructionsPage, and CreatePostDialog
- **Instructions Page Improvements:** Enhanced trend creator information display
  - Added creator bio display below username on Instructions page
  - Bio shows conditionally only if the creator has filled it in
  - Improved reference media grid layout (responsive 1-3 columns based on count)
  - Videos display with controls, images use object-cover for consistent presentation
- **Category System Update:** Expanded and organized category list
  - Added "Education" category across all pages (HomePage, CategorySelection, CreateTrend, storage)
  - Alphabetically sorted all categories with "All" always first on HomePage
  - Consistent category list across frontend and backend (11 categories total)
- **Trending Algorithm Refinement:** Improved trending trend selection
  - Changed from engagement-based to participation rate-based sorting
  - Now shows top 10 trends with highest participation rates (participants/views * 100)
  - Filters out trends with zero views to prevent division errors

**October 10, 2025:**
- **Profile Page User Posts:** Implemented user posts display in Profile page
  - Added `/api/posts/user/:userId` endpoint to fetch posts by user
  - Posts displayed as clickable image thumbnails in grid layout
  - Clicking post thumbnail navigates to trend feed page
  - Shows proper loading skeleton and empty states
- **Button Positioning Fix:** Corrected sticky button positions in FeedPage
  - Chat button now positioned above create post button (bottom-24 vs bottom-6)
  - Both buttons remain sticky in bottom-right corner

**October 7, 2025:**
- **Image Upload System:** Implemented complete image upload functionality using Replit object storage and Uppy file uploader
  - Added ObjectUploader component with modal interface for image uploads
  - Integrated image uploads for profile pictures and post creation
  - Using presigned URLs and ACL policies for secure, direct-to-storage uploads
  - Fixed Uppy CSS loading by using CDN links in index.html
- **Removed Mock Data:** Replaced all placeholder data with real API calls
  - DashboardPage now fetches real user statistics via `/api/dashboard/stats` endpoint
  - RankingsPage fetches actual rankings from `/api/rankings/:id`
  - InstructionsPage displays real trend data from `/api/trends/:id`
  - All pages show proper loading and empty states
- Updated trend status badges (Ended/Ending Soon) to display centered over trend card images with red background styling
- Fixed create post button visibility in feed - now always visible when trend is active (removed userHasPosted condition)
- Modernized FeedChatPage with new layout: trend info card header, cleaner chat messages with avatars, and fixed message input footer

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system

**Design System:**
- Custom color palette with light/dark mode support using CSS variables
- Typography based on Inter font family via Google Fonts
- Consistent spacing scale using Tailwind units
- Component library following modern social platform patterns (Instagram cards, Twitter feed layout, LinkedIn profile structure)
- Elevated card designs with shadow transitions for interactive elements

**Key Frontend Patterns:**
- Component-based architecture with reusable UI components
- Custom hooks for mobile detection and toast notifications
- Form handling with React Hook Form and Zod validation
- Responsive design with mobile-first approach
- Path aliases for clean imports (@/, @shared/, @assets/)

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Build Tool**: Vite for frontend, esbuild for backend bundling
- **Development**: tsx for TypeScript execution

**Storage Interface:**
- Abstract storage interface (IStorage) for CRUD operations
- In-memory storage implementation (MemStorage) for development
- Designed for easy migration to persistent database storage
- User management with username-based authentication

**API Design:**
- RESTful endpoints prefixed with /api
- Request/response logging middleware
- JSON body parsing with Express
- Error handling middleware with status code propagation

### Data Model

**Core Entities:**

1. **Users**
   - Authentication credentials (username, password)
   - Profile information (bio, profile picture)
   - Social stats (followers, following)
   - UUID-based primary keys

2. **Trends**
   - Creator reference to user
   - Trend metadata (name, instructions, rules array)
   - Category classification
   - Engagement metrics (views, participants, chat count)
   - Optional cover picture and end date support

3. **Posts**
   - Belongs to trend and user
   - Media content (image URL)
   - Optional caption
   - Vote count tracking
   - Timestamp for sorting/ranking

4. **Votes**
   - Links posts, users, and trends
   - Prevents duplicate voting
   - Supports ranking calculations

5. **Comments**
   - Supports both post and trend-level discussions
   - Nested reply structure with parent references
   - User attribution and timestamps

**Database Schema Patterns:**
- PostgreSQL with UUID primary keys (gen_random_uuid())
- Foreign key relationships for data integrity
- Text arrays for flexible rule storage
- Timestamp tracking with defaultNow()
- Integer counters with default values

### External Dependencies

**UI Component Libraries:**
- **Radix UI**: Comprehensive set of unstyled, accessible components (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, hover-card, navigation-menu, popover, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, toggle, tooltip)
- **Shadcn/ui**: Pre-configured component patterns built on Radix
- **class-variance-authority**: Type-safe variant handling for components
- **cmdk**: Command palette component

**Utilities:**
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon library
- **react-icons**: Additional social media icons (Instagram, TikTok, X/Twitter, YouTube)
- **clsx & tailwind-merge**: Conditional class name utilities
- **zod**: Schema validation with Drizzle integration (drizzle-zod)

**Database & ORM:**
- **@neondatabase/serverless**: PostgreSQL serverless driver with WebSocket support
- **drizzle-orm**: Type-safe ORM with schema-first approach
- **drizzle-kit**: Migration tooling and schema management

**Development Tools:**
- **Vite**: Frontend build tool with HMR
- **esbuild**: Fast backend bundling
- **tsx**: TypeScript execution for development
- **@replit/vite-plugin-***: Replit-specific development enhancements (runtime error overlay, cartographer, dev banner)

**Authentication & Sessions:**
- **connect-pg-simple**: PostgreSQL session store for Express

**Form Management:**
- **react-hook-form**: Performant form handling
- **@hookform/resolvers**: Validation resolver integration

**Visualization:**
- **recharts**: Chart components for dashboard analytics

**Carousel:**
- **embla-carousel-react**: Touch-friendly carousel for reference media galleries

**File Upload:**
- **@uppy/core**: File uploader core functionality
- **@uppy/react**: React components for Uppy
- **@uppy/dashboard**: Dashboard UI for file uploads
- **@uppy/aws-s3**: AWS S3 (and compatible services) upload support for Uppy