import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  fullName: text("full_name"),
  password: text("password").notNull(),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  trendxPoints: integer("trendx_points").default(0),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  categories: text("categories").array(),
  role: text("role"),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trendId: varchar("trend_id").notNull().references(() => trends.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  fullName: true,
  password: true,
  profilePicture: true,
  categories: true,
  role: true,
});

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

export const insertSavedTrendSchema = createInsertSchema(savedTrends).omit({
  id: true,
  createdAt: true,
});

export const insertSavedPostSchema = createInsertSchema(savedPosts).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrend = z.input<typeof insertTrendSchema>;
export type Trend = typeof trends.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertViewTracking = z.infer<typeof insertViewTrackingSchema>;
export type ViewTracking = typeof viewTracking.$inferSelect;
export type InsertSavedTrend = z.infer<typeof insertSavedTrendSchema>;
export type SavedTrend = typeof savedTrends.$inferSelect;
export type InsertSavedPost = z.infer<typeof insertSavedPostSchema>;
export type SavedPost = typeof savedPosts.$inferSelect;
