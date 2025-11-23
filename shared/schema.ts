import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  fullName: text("full_name"),
  password: text("password"),
  googleId: text("google_id").unique(),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  trendxPoints: integer("trendx_points").default(0),
  verified: integer("verified").default(0),
  profileComplete: integer("profile_complete").default(0),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  categories: text("categories").array(),
  role: text("role"),
  notificationsEnabled: integer("notifications_enabled").default(1),
});

export const trends = pgTable("trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  instructions: text("instructions").notNull(),
  rules: text("rules").array().notNull(),
  category: text("category").notNull(),
  coverPicture: text("cover_picture"),
  referenceMedia: text("reference_media").array(),
  views: integer("views").default(0),
  participants: integer("participants").default(0),
  chatCount: integer("chat_count").default(0),
  endDate: timestamp("end_date").notNull(),
  pointsAwarded: integer("points_awarded").default(0),
  prizeFirst: text("prize_first"),
  prizeSecond: text("prize_second"),
  prizeThird: text("prize_third"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trendId: varchar("trend_id").notNull().references(() => trends.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type").default('image'),
  caption: text("caption"),
  votes: integer("votes").default(0),
  commentCount: integer("comment_count").default(0),
  isDisqualified: integer("is_disqualified").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  trendId: varchar("trend_id").notNull().references(() => trends.id),
  count: integer("count").default(1).notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  trendId: varchar("trend_id").references(() => trends.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  parentId: varchar("parent_id"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const viewTracking = pgTable("view_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'category' or 'chat'
  identifier: text("identifier").notNull(), // category name or trend ID
  lastViewedAt: timestamp("last_viewed_at").defaultNow(),
});

export const savedTrends = pgTable("saved_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  trendId: varchar("trend_id").notNull().references(() => trends.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedPosts = pgTable("saved_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: varchar("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // who receives the notification
  actorId: varchar("actor_id").references(() => users.id), // who triggered the notification (can be null for system notifications)
  type: text("type").notNull(), // 14 notification types
  postId: varchar("post_id").references(() => posts.id),
  trendId: varchar("trend_id").references(() => trends.id),
  commentId: varchar("comment_id").references(() => comments.id),
  voteCount: integer("vote_count"),
  pointsEarned: integer("points_earned"),
  variant: integer("variant"), // for rotating variants
  isRead: integer("is_read").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationTracking = pgTable("notification_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  lastSentAt: timestamp("last_sent_at").defaultNow(),
  countToday: integer("count_today").default(1),
  lastVariant: integer("last_variant").default(0),
});

export const oneSignalSubscriptions = pgTable("one_signal_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: text("subscription_id").notNull(),
  oneSignalUserId: text("one_signal_user_id"),
  externalId: text("external_id").notNull(), // Trendx user ID
  pushToken: text("push_token"),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  fullName: true,
  password: true,
  googleId: true,
  profilePicture: true,
  categories: true,
  role: true,
  profileComplete: true,
}).partial({ password: true, googleId: true, profileComplete: true }).refine(
  (data) => data.password || data.googleId,
  { message: "Either password or googleId is required" }
);

export const insertTrendSchema = createInsertSchema(trends).omit({
  id: true,
  views: true,
  participants: true,
  chatCount: true,
  createdAt: true,
}).extend({
  endDate: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  referenceMedia: z.array(z.string()).nullable().optional(),
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  votes: true,
  commentCount: true,
  isDisqualified: true,
  createdAt: true,
}).extend({
  mediaType: z.enum(['image', 'video']).default('image'),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertViewTrackingSchema = createInsertSchema(viewTracking).omit({
  id: true,
  lastViewedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Trend = typeof trends.$inferSelect;
export type InsertTrend = z.infer<typeof insertTrendSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type ViewTracking = typeof viewTracking.$inferSelect;
export type InsertViewTracking = z.infer<typeof insertViewTrackingSchema>;
export type SavedTrend = typeof savedTrends.$inferSelect;
export type SavedPost = typeof savedPosts.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const insertSavedTrendSchema = createInsertSchema(savedTrends).omit({
  id: true,
  createdAt: true,
});

export const insertSavedPostSchema = createInsertSchema(savedPosts).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertSavedTrend = z.infer<typeof insertSavedTrendSchema>;
export type InsertSavedPost = z.infer<typeof insertSavedPostSchema>;
export type NotificationTracking = typeof notificationTracking.$inferSelect;
export const insertNotificationTrackingSchema = createInsertSchema(notificationTracking).omit({
  id: true,
  lastSentAt: true,
});

export type OneSignalSubscription = typeof oneSignalSubscriptions.$inferSelect;
export const insertOneSignalSubscriptionSchema = createInsertSchema(oneSignalSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  oneSignalUserId: true,
  pushToken: true,
});

export type InsertOneSignalSubscription = z.infer<typeof insertOneSignalSubscriptionSchema>;
