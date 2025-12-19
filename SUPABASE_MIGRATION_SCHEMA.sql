-- ============================================================================
-- TRENDX SUPABASE COMPLETE MIGRATION SCHEMA
-- ============================================================================
-- This schema implements the complete Trendx social media platform.
-- - All tables use UUID primary keys with gen_random_uuid() defaults
-- - All tables include created_at timestamps
-- - Foreign key constraints maintain data integrity
-- - Indexes optimize query performance
-- - RLS policies enforce user-level data access control

-- ============================================================================
-- SECTION 1: ENABLE REQUIRED EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 2: CREATE TABLES
-- ============================================================================

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  password TEXT,
  google_id TEXT UNIQUE,
  bio TEXT,
  profile_picture TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  trendx_points INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  profile_complete INTEGER DEFAULT 0,
  instagram_url TEXT,
  tiktok_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  categories TEXT[],
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT username_not_empty CHECK (LENGTH(TRIM(username)) > 0),
  CONSTRAINT email_format CHECK (email IS NULL OR email LIKE '%@%'),
  CONSTRAINT verified_binary CHECK (verified IN (0, 1)),
  CONSTRAINT profile_complete_binary CHECK (profile_complete IN (0, 1))
);

-- Trends Table
CREATE TABLE IF NOT EXISTS public.trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  rules TEXT[],
  category TEXT NOT NULL,
  cover_picture TEXT,
  reference_media TEXT[],
  views INTEGER DEFAULT 0,
  participants INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  prize_first TEXT,
  prize_second TEXT,
  prize_third TEXT,
  trend_name_font TEXT DEFAULT 'inter',
  trend_name_color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT end_date_future CHECK (end_date > CURRENT_TIMESTAMP)
);

-- Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID NOT NULL REFERENCES public.trends(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  caption TEXT,
  votes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_disqualified INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT media_type_valid CHECK (media_type IN ('image', 'video')),
  CONSTRAINT is_disqualified_binary CHECK (is_disqualified IN (0, 1))
);

-- Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trend_id UUID NOT NULL REFERENCES public.trends(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vote_count_positive CHECK (count > 0),
  CONSTRAINT unique_vote_per_user UNIQUE (post_id, user_id)
);

-- Comments Table (supports nested replies with parent_id)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  trend_id UUID REFERENCES public.trends(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT text_not_empty CHECK (LENGTH(TRIM(text)) > 0),
  CONSTRAINT post_or_trend_required CHECK (post_id IS NOT NULL OR trend_id IS NOT NULL)
);

-- Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Disqualified Users Table (prevents users from posting in specific trends)
CREATE TABLE IF NOT EXISTS public.disqualified_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trend_id UUID NOT NULL REFERENCES public.trends(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_disqualification UNIQUE (user_id, trend_id)
);

-- View Tracking Table (tracks user navigation for analytics)
CREATE TABLE IF NOT EXISTS public.view_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT view_type_valid CHECK (type IN ('category', 'chat'))
);

-- Saved Trends Table
CREATE TABLE IF NOT EXISTS public.saved_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trend_id UUID NOT NULL REFERENCES public.trends(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_saved_trend UNIQUE (user_id, trend_id)
);

-- Saved Posts Table
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_saved_post UNIQUE (user_id, post_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  trend_id UUID REFERENCES public.trends(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  vote_count INTEGER,
  points_earned INTEGER,
  variant INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT is_read_binary CHECK (is_read IN (0, 1)),
  CONSTRAINT notification_type_valid CHECK (type IN (
    'post_vote', 'post_comment', 'comment_reply', 'new_follower', 'new_post',
    'comment_vote', 'trend_ended', 'points_earned', 'verification_badge',
    'ranking_updated', 'post_deleted', 'user_disqualified', 'chat_message',
    'chat_mention', 'daily_digest'
  ))
);

-- Notification Tracking Table (rate limiting for daily notifications)
CREATE TABLE IF NOT EXISTS public.notification_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  count_today INTEGER DEFAULT 1,
  last_variant INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OneSignal Subscriptions Table
CREATE TABLE IF NOT EXISTS public.one_signal_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL,
  one_signal_user_id TEXT,
  external_id TEXT NOT NULL,
  push_token TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT is_active_binary CHECK (is_active IN (0, 1))
);

-- Email Verification Codes Table
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT code_not_empty CHECK (LENGTH(TRIM(code)) > 0)
);

-- ============================================================================
-- SECTION 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_username ON public.users(LOWER(username));
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_google_id ON public.users(google_id);

-- Trends indexes
CREATE INDEX idx_trends_user_id ON public.trends(user_id);
CREATE INDEX idx_trends_category ON public.trends(category);
CREATE INDEX idx_trends_end_date ON public.trends(end_date);
CREATE INDEX idx_trends_created_at ON public.trends(created_at DESC);
CREATE INDEX idx_trends_views ON public.trends(views DESC);

-- Posts indexes
CREATE INDEX idx_posts_trend_id ON public.posts(trend_id);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_votes ON public.posts(votes DESC);
CREATE INDEX idx_posts_trend_votes ON public.posts(trend_id, votes DESC);
CREATE INDEX idx_posts_is_disqualified ON public.posts(is_disqualified);

-- Votes indexes
CREATE INDEX idx_votes_post_id ON public.votes(post_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_trend_id ON public.votes(trend_id);
CREATE INDEX idx_votes_created_at ON public.votes(created_at);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_trend_id ON public.comments(trend_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at);

-- Follows indexes
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- Disqualified users indexes
CREATE INDEX idx_disqualified_users_user_id ON public.disqualified_users(user_id);
CREATE INDEX idx_disqualified_users_trend_id ON public.disqualified_users(trend_id);

-- View tracking indexes
CREATE INDEX idx_view_tracking_user_id ON public.view_tracking(user_id);
CREATE INDEX idx_view_tracking_type_identifier ON public.view_tracking(type, identifier);

-- Saved trends/posts indexes
CREATE INDEX idx_saved_trends_user_id ON public.saved_trends(user_id);
CREATE INDEX idx_saved_posts_user_id ON public.saved_posts(user_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- OneSignal subscriptions indexes
CREATE INDEX idx_one_signal_subscriptions_user_id ON public.one_signal_subscriptions(user_id);
CREATE INDEX idx_one_signal_subscriptions_external_id ON public.one_signal_subscriptions(external_id);

-- Email verification codes indexes
CREATE INDEX idx_email_verification_codes_code ON public.email_verification_codes(code);
CREATE INDEX idx_email_verification_codes_expires_at ON public.email_verification_codes(expires_at);

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disqualified_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_signal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'sub')::UUID;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- USERS POLICIES
-- ============================================================================
-- Users can view all profiles (public)
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can only update their own profile"
  ON public.users FOR UPDATE
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());

-- Only system can insert users (via auth)
CREATE POLICY "Only system can insert users"
  ON public.users FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- TRENDS POLICIES
-- ============================================================================
-- Anyone can view all trends
CREATE POLICY "Anyone can view trends"
  ON public.trends FOR SELECT
  USING (true);

-- Users can create trends
CREATE POLICY "Authenticated users can create trends"
  ON public.trends FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can only update their own trends
CREATE POLICY "Users can only update their own trends"
  ON public.trends FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Users can only delete their own trends
CREATE POLICY "Users can only delete their own trends"
  ON public.trends FOR DELETE
  USING (user_id = current_user_id());

-- ============================================================================
-- POSTS POLICIES
-- ============================================================================
-- Anyone can view posts
CREATE POLICY "Anyone can view posts"
  ON public.posts FOR SELECT
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can only update their own posts
CREATE POLICY "Users can only update their own posts"
  ON public.posts FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Post owner or trend creator can delete posts
CREATE POLICY "Post owner or trend creator can delete posts"
  ON public.posts FOR DELETE
  USING (
    user_id = current_user_id() OR
    trend_id IN (
      SELECT id FROM public.trends WHERE user_id = current_user_id()
    )
  );

-- ============================================================================
-- VOTES POLICIES
-- ============================================================================
-- Anyone can view votes
CREATE POLICY "Anyone can view votes"
  ON public.votes FOR SELECT
  USING (true);

-- Authenticated users can create votes
CREATE POLICY "Authenticated users can create votes"
  ON public.votes FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE
  USING (user_id = current_user_id());

-- ============================================================================
-- COMMENTS POLICIES
-- ============================================================================
-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can only update their own comments
CREATE POLICY "Users can only update their own comments"
  ON public.comments FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (user_id = current_user_id());

-- ============================================================================
-- FOLLOWS POLICIES
-- ============================================================================
-- Anyone can view follow relationships
CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

-- Authenticated users can create follow relationships
CREATE POLICY "Authenticated users can create follows"
  ON public.follows FOR INSERT
  WITH CHECK (follower_id = current_user_id());

-- Users can unfollow
CREATE POLICY "Users can delete their own follows"
  ON public.follows FOR DELETE
  USING (follower_id = current_user_id());

-- ============================================================================
-- DISQUALIFIED USERS POLICIES
-- ============================================================================
-- Trend creators can view disqualified users
CREATE POLICY "Trend creators can view disqualified users"
  ON public.disqualified_users FOR SELECT
  USING (
    trend_id IN (
      SELECT id FROM public.trends WHERE user_id = current_user_id()
    )
  );

-- Trend creators can disqualify users
CREATE POLICY "Trend creators can disqualify users"
  ON public.disqualified_users FOR INSERT
  WITH CHECK (
    trend_id IN (
      SELECT id FROM public.trends WHERE user_id = current_user_id()
    )
  );

-- ============================================================================
-- VIEW TRACKING POLICIES
-- ============================================================================
-- Users can only view their own tracking data
CREATE POLICY "Users can only view their own tracking"
  ON public.view_tracking FOR SELECT
  USING (user_id = current_user_id());

-- Users can create their own tracking records
CREATE POLICY "Users can create their own tracking"
  ON public.view_tracking FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can update their own tracking records
CREATE POLICY "Users can update their own tracking"
  ON public.view_tracking FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- ============================================================================
-- SAVED TRENDS POLICIES
-- ============================================================================
-- Users can only view their own saved trends
CREATE POLICY "Users can only view their own saved trends"
  ON public.saved_trends FOR SELECT
  USING (user_id = current_user_id());

-- Users can save trends
CREATE POLICY "Users can save trends"
  ON public.saved_trends FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can delete their own saved trends
CREATE POLICY "Users can delete their own saved trends"
  ON public.saved_trends FOR DELETE
  USING (user_id = current_user_id());

-- ============================================================================
-- SAVED POSTS POLICIES
-- ============================================================================
-- Users can only view their own saved posts
CREATE POLICY "Users can only view their own saved posts"
  ON public.saved_posts FOR SELECT
  USING (user_id = current_user_id());

-- Users can save posts
CREATE POLICY "Users can save posts"
  ON public.saved_posts FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can delete their own saved posts
CREATE POLICY "Users can delete their own saved posts"
  ON public.saved_posts FOR DELETE
  USING (user_id = current_user_id());

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================
-- Users can only view their own notifications
CREATE POLICY "Users can only view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = current_user_id());

-- Only system can create notifications
CREATE POLICY "Only system can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (false);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = current_user_id());

-- ============================================================================
-- NOTIFICATION TRACKING POLICIES
-- ============================================================================
-- Users can only view their own tracking data
CREATE POLICY "Users can only view their own notification tracking"
  ON public.notification_tracking FOR SELECT
  USING (user_id = current_user_id());

-- Only system can create/update tracking
CREATE POLICY "Only system can manage notification tracking"
  ON public.notification_tracking FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- ONE SIGNAL SUBSCRIPTIONS POLICIES
-- ============================================================================
-- Users can only view their own subscriptions
CREATE POLICY "Users can only view their own subscriptions"
  ON public.one_signal_subscriptions FOR SELECT
  USING (user_id = current_user_id());

-- Users can create their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
  ON public.one_signal_subscriptions FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
  ON public.one_signal_subscriptions FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- ============================================================================
-- EMAIL VERIFICATION CODES POLICIES
-- ============================================================================
-- Public access to verify codes during signup
CREATE POLICY "Public can view verification codes"
  ON public.email_verification_codes FOR SELECT
  USING (true);

-- Anyone can create verification codes
CREATE POLICY "Anyone can create verification codes"
  ON public.email_verification_codes FOR INSERT
  WITH CHECK (true);

-- Anyone can delete verification codes
CREATE POLICY "Anyone can delete verification codes"
  ON public.email_verification_codes FOR DELETE
  USING (true);

-- ============================================================================
-- SECTION 5: EXAMPLE SQL QUERIES
-- ============================================================================

-- ============================================================================
-- QUERY 1: Fetch all posts for a trend ordered by votes (likes)
-- ============================================================================
-- This query gets the top posts in a trend, ordered by vote count.
-- Includes creator information and filters out disqualified posts.
/*
SELECT
  p.id,
  p.caption,
  p.votes,
  p.comment_count,
  p.media_type,
  p.media_url,
  p.image_url,
  p.created_at,
  u.id AS creator_id,
  u.username,
  u.profile_picture,
  u.verified,
  t.name AS trend_name
FROM public.posts p
LEFT JOIN public.users u ON p.user_id = u.id
LEFT JOIN public.trends t ON p.trend_id = t.id
WHERE
  p.trend_id = 'YOUR_TREND_ID'
  AND p.is_disqualified = 0
ORDER BY p.votes DESC, p.created_at DESC
LIMIT 50;
*/

-- ============================================================================
-- QUERY 2: Fetch top 3 ranked posts for a trend (with vote counts)
-- ============================================================================
-- This gets the 3 highest-voted posts in a trend for leaderboard/ranking.
/*
SELECT
  p.id,
  p.caption,
  p.votes AS vote_count,
  p.comment_count,
  p.created_at,
  u.id AS creator_id,
  u.username,
  u.profile_picture,
  u.verified,
  ROW_NUMBER() OVER (ORDER BY p.votes DESC) AS rank
FROM public.posts p
LEFT JOIN public.users u ON p.user_id = u.id
WHERE
  p.trend_id = 'YOUR_TREND_ID'
  AND p.is_disqualified = 0
ORDER BY p.votes DESC
LIMIT 3;
*/

-- ============================================================================
-- QUERY 3: Get comprehensive trend analytics
-- ============================================================================
-- This query aggregates all analytics data for a trend.
/*
SELECT
  t.id,
  t.name,
  t.views,
  t.participants,
  COUNT(DISTINCT p.id) AS total_posts,
  COUNT(DISTINCT v.id) AS total_votes,
  COUNT(DISTINCT c.id) AS total_comments,
  COUNT(DISTINCT p.user_id) AS unique_contributors,
  ROUND(COUNT(DISTINCT v.id)::numeric / NULLIF(COUNT(DISTINCT p.id), 0), 2) AS avg_votes_per_post,
  ROUND(
    (COUNT(DISTINCT v.id) + COUNT(DISTINCT c.id))::numeric / 
    NULLIF(COUNT(DISTINCT p.user_id) * 10, 0) * 100, 
    2
  ) AS engagement_rate
FROM public.trends t
LEFT JOIN public.posts p ON t.id = p.trend_id AND p.is_disqualified = 0
LEFT JOIN public.votes v ON p.id = v.post_id
LEFT JOIN public.comments c ON p.id = c.post_id
WHERE t.id = 'YOUR_TREND_ID'
GROUP BY t.id, t.name, t.views, t.participants;
*/

-- ============================================================================
-- QUERY 4: Get top 5 posts in a trend with full details
-- ============================================================================
-- This query is useful for the analytics dashboard.
/*
SELECT
  p.id,
  p.caption,
  COUNT(DISTINCT v.id) AS vote_count,
  u.username,
  p.media_type,
  p.media_url,
  p.image_url,
  p.created_at
FROM public.posts p
LEFT JOIN public.votes v ON p.id = v.post_id
LEFT JOIN public.users u ON p.user_id = u.id
WHERE
  p.trend_id = 'YOUR_TREND_ID'
  AND p.is_disqualified = 0
GROUP BY p.id, u.id, u.username
ORDER BY vote_count DESC, p.created_at DESC
LIMIT 5;
*/

-- ============================================================================
-- QUERY 5: Get user's followed posts (feed)
-- ============================================================================
-- Fetches posts from users that the current user follows.
/*
SELECT
  p.id,
  p.caption,
  p.votes,
  p.comment_count,
  p.media_type,
  p.media_url,
  p.image_url,
  p.created_at,
  u.username,
  u.profile_picture,
  u.verified,
  t.id AS trend_id,
  t.name AS trend_name
FROM public.posts p
LEFT JOIN public.users u ON p.user_id = u.id
LEFT JOIN public.trends t ON p.trend_id = t.id
WHERE
  p.user_id IN (
    SELECT following_id FROM public.follows WHERE follower_id = 'CURRENT_USER_ID'
  )
  AND p.is_disqualified = 0
ORDER BY p.created_at DESC
LIMIT 50;
*/

-- ============================================================================
-- QUERY 6: Get user profile with follower/following counts
-- ============================================================================
/*
SELECT
  u.id,
  u.username,
  u.full_name,
  u.bio,
  u.profile_picture,
  u.verified,
  u.trendx_points,
  u.instagram_url,
  u.tiktok_url,
  u.twitter_url,
  u.youtube_url,
  u.categories,
  COUNT(DISTINCT f1.id) AS followers_count,
  COUNT(DISTINCT f2.id) AS following_count,
  (
    SELECT COUNT(*) FROM public.follows 
    WHERE follower_id = 'CURRENT_USER_ID' AND following_id = u.id
  ) AS is_followed_by_current_user
FROM public.users u
LEFT JOIN public.follows f1 ON u.id = f1.following_id
LEFT JOIN public.follows f2 ON u.id = f2.follower_id
WHERE u.id = 'USER_ID'
GROUP BY u.id;
*/

-- ============================================================================
-- QUERY 7: Get user's created trends
-- ============================================================================
/*
SELECT
  t.id,
  t.name,
  t.description,
  t.cover_picture,
  t.category,
  t.views,
  t.participants,
  t.end_date,
  COUNT(DISTINCT p.id) AS post_count,
  COUNT(DISTINCT v.id) AS total_votes,
  COUNT(DISTINCT c.id) AS total_comments
FROM public.trends t
LEFT JOIN public.posts p ON t.id = p.trend_id AND p.is_disqualified = 0
LEFT JOIN public.votes v ON p.id = v.post_id
LEFT JOIN public.comments c ON p.id = c.post_id
WHERE t.user_id = 'USER_ID'
GROUP BY t.id
ORDER BY t.created_at DESC;
*/

-- ============================================================================
-- QUERY 8: Get trending categories (most viewed)
-- ============================================================================
/*
SELECT
  category,
  COUNT(DISTINCT id) AS trend_count,
  SUM(views) AS total_views,
  SUM(participants) AS total_participants
FROM public.trends
WHERE end_date > CURRENT_TIMESTAMP
GROUP BY category
ORDER BY total_views DESC, trend_count DESC
LIMIT 10;
*/

-- ============================================================================
-- QUERY 9: Check if user is disqualified from a trend
-- ============================================================================
/*
SELECT EXISTS (
  SELECT 1 FROM public.disqualified_users
  WHERE user_id = 'USER_ID' AND trend_id = 'TREND_ID'
) AS is_disqualified;
*/

-- ============================================================================
-- QUERY 10: Get user's notifications (unread first)
-- ============================================================================
/*
SELECT
  n.id,
  n.type,
  n.is_read,
  n.points_earned,
  n.vote_count,
  n.created_at,
  a.username AS actor_username,
  a.profile_picture AS actor_picture,
  t.name AS trend_name,
  p.caption AS post_caption
FROM public.notifications n
LEFT JOIN public.users a ON n.actor_id = a.id
LEFT JOIN public.trends t ON n.trend_id = t.id
LEFT JOIN public.posts p ON n.post_id = p.id
WHERE n.user_id = 'CURRENT_USER_ID'
ORDER BY n.is_read ASC, n.created_at DESC
LIMIT 50;
*/

-- ============================================================================
-- END OF SUPABASE MIGRATION SCHEMA
-- ============================================================================
