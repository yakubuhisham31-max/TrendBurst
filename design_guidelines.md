# Mini Feed App - Design Guidelines

## Design Approach
**Reference-Based Approach** drawing from modern social platforms (Instagram's visual cards, Twitter's clean feed layout, LinkedIn's professional profile structure) with custom elements for the unique voting and trending system.

## Color Palette

### Light Mode
- **Background**: 0 0% 98%
- **Surface/Cards**: 0 0% 100%
- **Primary Brand**: 262 83% 58% (vibrant purple for actions)
- **Secondary**: 221 83% 53% (blue for rankings/stats)
- **Text Primary**: 0 0% 13%
- **Text Secondary**: 0 0% 45%
- **Border**: 0 0% 90%
- **Success (Thumbs Up)**: 142 71% 45%
- **Danger (Thumbs Down)**: 0 72% 51%

### Dark Mode
- **Background**: 0 0% 9%
- **Surface/Cards**: 0 0% 13%
- **Primary Brand**: 262 70% 65%
- **Secondary**: 221 70% 60%
- **Text Primary**: 0 0% 95%
- **Text Secondary**: 0 0% 65%
- **Border**: 0 0% 20%
- **Success**: 142 65% 50%
- **Danger**: 0 65% 55%

## Typography
- **Primary Font**: Inter (via Google Fonts) - clean, modern sans-serif
- **Headings**: 
  - H1: 2rem (32px), font-weight 700
  - H2: 1.5rem (24px), font-weight 600
  - H3: 1.25rem (20px), font-weight 600
- **Body**: 0.875rem (14px), font-weight 400
- **Small/Meta**: 0.75rem (12px), font-weight 500
- **Captions**: 0.8125rem (13px), font-weight 400

## Layout System
**Spacing Scale**: Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16 for consistent rhythm
- **Container Max Width**: max-w-7xl for main content
- **Card Padding**: p-4 on mobile, p-6 on desktop
- **Section Spacing**: space-y-4 for mobile, space-y-6 for desktop
- **Grid Gaps**: gap-4 on mobile, gap-6 on desktop

## Component Library

### Homepage - Trend Cards
- **Card Design**: Elevated cards with subtle shadow (shadow-sm hover:shadow-md transition)
- **Grid Layout**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Card Structure**:
  - Cover image at top (aspect-ratio-video, object-cover)
  - Trend name (text-lg font-semibold)
  - User info row: profile pic (w-8 h-8 rounded-full), username (text-sm font-medium)
  - Meta row with icons: views, participants, chat count (flex gap-4, text-xs text-secondary)
  - Category badge (top-right absolute, rounded-full px-3 py-1, bg-primary/10 text-primary text-xs)
- **Hover State**: Subtle lift (transform hover:-translate-y-1 transition-transform)

### Navigation
- **Hamburger Menu**: Fixed top-left, w-10 h-10, rounded-full bg-surface shadow-md
- **Slide-out Menu**: Full-height drawer (w-72), slides from left, backdrop blur overlay
- **Menu Items**: py-3 px-4, hover:bg-primary/5, rounded-lg transition

### Feed Page
- **Header Bar**: Sticky top-0, bg-surface/95 backdrop-blur, border-b, z-10
- **Post Cards**: 
  - Single column feed (max-w-2xl mx-auto)
  - Rank badge (top-right, circular, w-12 h-12, gradient bg, white text, shadow-lg)
  - Image container (rounded-lg overflow-hidden, max-h-[500px])
  - Vote buttons row: Flex justify-between, thumbs up/down (w-12 h-12 rounded-full, icon buttons)
  - Vote counter: Center between buttons, text-lg font-bold
  - Caption: text-sm mt-3, max 3 lines with "Read more" expansion
  - Comment section: Collapsible, indent pl-4, border-l-2

### Profile Page
- **Header Section**: 
  - Cover gradient (h-32 md:h-48, gradient from primary to secondary)
  - Profile pic overlapping cover (w-24 h-24 md:w-32 md:h-32, ring-4 ring-surface)
- **Stats Row**: Grid-cols-4, text-center, border-b pb-4
- **Tabs**: Horizontal scroll on mobile, sticky navigation for sections
- **Content Grid**: grid-cols-2 md:grid-cols-3 gap-3 for posts/trends

### Create Trend Modal
- **Modal**: Full-screen on mobile, centered card (max-w-2xl) on desktop
- **Form Layout**: Single column, space-y-6
- **Cover Upload**: Drag-and-drop zone (border-2 border-dashed, rounded-lg, h-48)
- **Category Selector**: Grid of pills (grid-cols-3 gap-2, rounded-full buttons)
- **Rules Input**: Numbered list builder with add/remove

### Floating Chat Button
- **Position**: Fixed bottom-left (bottom-6 left-6)
- **Style**: w-14 h-14, rounded-full, bg-primary, shadow-lg, chat icon
- **Badge**: Notification count (absolute -top-1 -right-1, rounded-full, bg-danger)

### Rankings Page
- **Podium Design**: Top 3 posts displayed as visual podium (1st tallest in center)
- **List View**: Below podium, numbered list with thumbnails and vote counts
- **Filters**: Sticky top bar with time filters (Today, This Week, All Time)

## Images

### Required Images
1. **Trend Cover Images**: 16:9 aspect ratio, minimum 1200x675px, showcase trend theme
2. **User Profile Pictures**: Square (1:1), minimum 200x200px, circular display
3. **Post Images**: Flexible aspect ratios (support vertical/horizontal), max-height constraints for feed consistency
4. **Default Placeholders**: Gradient avatars with user initials for profiles without pictures

### Image Treatment
- **Border Radius**: rounded-lg for content images, rounded-full for avatars
- **Loading States**: Skeleton shimmer animations (bg-gradient-to-r from-border via-surface to-border)
- **Optimization**: Lazy loading, WebP format with fallbacks

## Micro-interactions
- **Vote Buttons**: Scale on click (scale-110), color pulse animation, haptic-style feedback
- **Card Hovers**: Subtle elevation increase
- **Button States**: Primary buttons darken on hover, outline buttons fill
- **Loading States**: Spinner for async actions, skeleton screens for initial loads

## Responsive Breakpoints
- **Mobile**: Base (< 768px) - single column, bottom navigation
- **Tablet**: md (768px+) - two-column grids, side navigation option
- **Desktop**: lg (1024px+) - three-column grids, persistent sidebar, hover states

## Accessibility
- **Focus Rings**: 2px offset, primary color, visible on keyboard navigation
- **Icon Labels**: aria-labels for all icon-only buttons
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- **Touch Targets**: Minimum 44x44px for all interactive elements

This design creates a modern, engaging social experience that balances familiarity with unique trending and voting mechanics. The visual hierarchy guides users naturally through creating, discovering, and engaging with trends while maintaining clean, uncluttered aesthetics.