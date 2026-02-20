import { drizzle } from "drizzle-orm/node-postgres";
import pg from 'pg';
const Pool = (pg as any).Pool;
import type { Pool as PgPool } from 'pg';
import { eq, and, desc, sql, isNull, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";
import dns from "node:dns";
import type {
  User,
  InsertUser,
  Trend,
  InsertTrend,
  Post,
  InsertPost,
  Vote,
  InsertVote,
  Comment,
  InsertComment,
  Follow,
  InsertFollow,
  ViewTracking,
  InsertViewTracking,
  SavedTrend,
  SavedPost,
  Notification,
  InsertNotification,
  OneSignalSubscription,
  InsertOneSignalSubscription,
  EmailVerificationCode,
  InsertEmailVerificationCode,
} from "@shared/schema";

// Prefer IPv4 in local development to avoid Windows IPv6 ENETUNREACH to Supabase.
if (process.env.NODE_ENV !== "production") {
  try {
    // Node >= 17
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // ignore (older Node)
  }
}

const pool: PgPool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  upsertUser(user: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Trends
  getTrend(id: string): Promise<Trend | undefined>;
  getAllTrends(category?: string): Promise<Trend[]>;
  getTrendsByUser(userId: string): Promise<Trend[]>;
  createTrend(trend: InsertTrend): Promise<Trend>;
  updateTrend(id: string, data: Partial<Trend>): Promise<Trend | undefined>;
  deleteTrend(id: string): Promise<void>;
  incrementTrendParticipants(trendId: string): Promise<void>;
  decrementTrendParticipants(trendId: string): Promise<void>;
  
  // Posts
  getPost(id: string): Promise<Post | undefined>;
  getPostsByTrend(trendId: string): Promise<Post[]>;
  getPostsByUser(userId: string): Promise<Post[]>;
  getRankedPostsForTrend(trendId: string): Promise<Array<Post & { user: User }>>;
  
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, data: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: string): Promise<void>;
  
  // Votes
  getVote(postId: string, userId: string): Promise<Vote | undefined>;
  getVotesByUser(userId: string, trendId: string): Promise<Vote[]>;
  incrementVote(postId: string, userId: string, trendId: string): Promise<Vote>;
  decrementVote(postId: string, userId: string): Promise<Vote | null>;
  
  // Comments
  getComment(id: string): Promise<Comment | undefined>;
  getCommentsByPost(postId: string): Promise<Comment[]>;
  getCommentsByTrend(trendId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  
  // Follows
  getFollow(followerId: string, followingId: string): Promise<Follow | undefined>;
  getFollowers(userId: string): Promise<Follow[]>;
  getFollowing(userId: string): Promise<Follow[]>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
  
  // View Tracking
  getViewTracking(userId: string, type: string, identifier: string): Promise<ViewTracking | undefined>;
  updateViewTracking(userId: string, type: string, identifier: string): Promise<ViewTracking>;
  
  // Saved Trends
  isTrendSaved(userId: string, trendId: string): Promise<boolean>;
  saveTrend(userId: string, trendId: string): Promise<SavedTrend>;
  unsaveTrend(userId: string, trendId: string): Promise<void>;
  getSavedTrends(userId: string): Promise<Trend[]>;
  
  // Saved Posts
  isPostSaved(userId: string, postId: string): Promise<boolean>;
  savePost(userId: string, postId: string): Promise<SavedPost>;
  unsavePost(userId: string, postId: string): Promise<void>;
  getSavedPosts(userId: string): Promise<Post[]>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getNewContentCounts(userId: string): Promise<any>;
  
  // OneSignal Subscriptions
  saveOneSignalSubscription(subscription: InsertOneSignalSubscription): Promise<OneSignalSubscription>;
  getOneSignalSubscription(userId: string): Promise<OneSignalSubscription | undefined>;
  
  // Email Verification Codes
  createVerificationCode(email: string, code: string, expiresAt: Date): Promise<EmailVerificationCode>;
  getVerificationCode(code: string): Promise<EmailVerificationCode | undefined>;
  deleteVerificationCode(code: string): Promise<void>;
  
  // Disqualification
  disqualifyUser(userId: string, trendId: string): Promise<void>;
  isUserDisqualified(userId: string, trendId: string): Promise<boolean>;
  
  // Analytics
  trackTrendView(userId: string, trendId: string): Promise<void>;
  getTrendAnalytics(trendId: string): Promise<any>;
  incrementPostCommentCount(postId: string): Promise<void>;
  decrementPostCommentCount(postId: string): Promise<void>;
  incrementTrendChatCount(trendId: string): Promise<void>;
  decrementTrendChatCount(trendId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.googleId, googleId));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async upsertUser(userData: Partial<User>): Promise<User> {
    if (!userData.username) {
      throw new Error("Username is required for upsert");
    }

    // Try to find existing user by username
    const existing = await this.getUserByUsername(userData.username);
    if (existing) {
      const updated = await this.updateUser(existing.id, userData);
      if (!updated) throw new Error("Failed to update user");
      return updated;
    }

    // Create new user
    const created = await this.createUser(userData as InsertUser);
    return created;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  // Trends
  async getTrend(id: string): Promise<Trend | undefined> {
    const [trend] = await db.select().from(schema.trends).where(eq(schema.trends.id, id));
    return trend;
  }

  async getAllTrends(category?: string): Promise<Trend[]> {
    if (category) {
      return await db
        .select()
        .from(schema.trends)
        .where(eq(schema.trends.category, category))
        .orderBy(desc(schema.trends.createdAt));
    }
    return await db.select().from(schema.trends).orderBy(desc(schema.trends.createdAt));
  }

  async getTrendsByUser(userId: string): Promise<Trend[]> {
    return await db
      .select()
      .from(schema.trends)
      .where(eq(schema.trends.userId, userId))
      .orderBy(desc(schema.trends.createdAt));
  }

  async createTrend(trendData: InsertTrend): Promise<Trend> {
    const [trend] = await db.insert(schema.trends).values(trendData).returning();
    return trend;
  }

  async updateTrend(id: string, data: Partial<Trend>): Promise<Trend | undefined> {
    const [trend] = await db.update(schema.trends).set(data).where(eq(schema.trends.id, id)).returning();
    return trend;
  }

  async deleteTrend(id: string): Promise<void> {
    await db.delete(schema.trends).where(eq(schema.trends.id, id));
  }

  async incrementTrendParticipants(trendId: string): Promise<void> {
    await db
      .update(schema.trends)
      .set({ participants: sql`${schema.trends.participants} + 1` })
      .where(eq(schema.trends.id, trendId));
  }

  async decrementTrendParticipants(trendId: string): Promise<void> {
    await db
      .update(schema.trends)
      .set({ participants: sql`GREATEST(${schema.trends.participants} - 1, 0)` })
      .where(eq(schema.trends.id, trendId));
  }

  // Posts
  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, id));
    return post;
  }

  async getPostsByTrend(trendId: string): Promise<Post[]> {
    return await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.trendId, trendId))
      .orderBy(desc(schema.posts.createdAt));
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    return await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.userId, userId))
      .orderBy(desc(schema.posts.createdAt));
  }

  async getRankedPostsForTrend(trendId: string): Promise<Array<Post & { user: User }>> {
    const results = await db
      .select({
        post: schema.posts,
        user: schema.users,
      })
      .from(schema.posts)
      .leftJoin(schema.users, eq(schema.posts.userId, schema.users.id))
      .where(and(eq(schema.posts.trendId, trendId), eq(schema.posts.isDisqualified, 0)))
      .orderBy(desc(schema.posts.votes));

    return results
      .filter((r) => r.user !== null)
      .map((r) => ({ ...r.post, user: r.user as User }));
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db.insert(schema.posts).values(postData).returning();
    return post;
  }

  async updatePost(id: string, data: Partial<Post>): Promise<Post | undefined> {
    const [post] = await db.update(schema.posts).set(data).where(eq(schema.posts.id, id)).returning();
    return post;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(schema.posts).where(eq(schema.posts.id, id));
  }

  // Votes
  async getVote(postId: string, userId: string): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(schema.votes)
      .where(and(eq(schema.votes.postId, postId), eq(schema.votes.userId, userId)));
    return vote;
  }

  async getVotesByUser(userId: string, trendId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(schema.votes)
      .where(and(eq(schema.votes.userId, userId), eq(schema.votes.trendId, trendId)));
  }

  async incrementVote(postId: string, userId: string, trendId: string): Promise<Vote> {
    const existing = await this.getVote(postId, userId);

    if (existing) {
      const [updated] = await db
        .update(schema.votes)
        .set({ count: (existing.count || 0) + 1 })
        .where(eq(schema.votes.id, existing.id))
        .returning();

      // update post vote count
      await db
        .update(schema.posts)
        .set({ votes: sql`${schema.posts.votes} + 1` })
        .where(eq(schema.posts.id, postId));

      return updated;
    }

    const [vote] = await db
      .insert(schema.votes)
      .values({ postId, userId, trendId, count: 1 })
      .returning();

    await db
      .update(schema.posts)
      .set({ votes: sql`${schema.posts.votes} + 1` })
      .where(eq(schema.posts.id, postId));

    return vote;
  }

  async decrementVote(postId: string, userId: string): Promise<Vote | null> {
    const existing = await this.getVote(postId, userId);

    if (!existing) return null;

    const current = existing.count || 0;

    if (current <= 1) {
      await db.delete(schema.votes).where(eq(schema.votes.id, existing.id));

      await db
        .update(schema.posts)
        .set({ votes: sql`GREATEST(${schema.posts.votes} - 1, 0)` })
        .where(eq(schema.posts.id, postId));

      return null;
    }

    const [updated] = await db
      .update(schema.votes)
      .set({ count: current - 1 })
      .where(eq(schema.votes.id, existing.id))
      .returning();

    await db
      .update(schema.posts)
      .set({ votes: sql`GREATEST(${schema.posts.votes} - 1, 0)` })
      .where(eq(schema.posts.id, postId));

    return updated;
  }

  // Comments
  async getComment(id: string): Promise<Comment | undefined> {
    const [comment] = await db.select().from(schema.comments).where(eq(schema.comments.id, id));
    return comment;
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.postId, postId))
      .orderBy(desc(schema.comments.createdAt));
  }

  async getCommentsByTrend(trendId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.trendId, trendId))
      .orderBy(desc(schema.comments.createdAt));
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(schema.comments).values(commentData).returning();
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(schema.comments).where(eq(schema.comments.id, id));
  }

  // Follows
  async getFollow(followerId: string, followingId: string): Promise<Follow | undefined> {
    const [follow] = await db
      .select()
      .from(schema.follows)
      .where(and(eq(schema.follows.followerId, followerId), eq(schema.follows.followingId, followingId)));
    return follow;
  }

  async getFollowers(userId: string): Promise<Follow[]> {
    return await db.select().from(schema.follows).where(eq(schema.follows.followingId, userId));
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    return await db.select().from(schema.follows).where(eq(schema.follows.followerId, userId));
  }

  async createFollow(followData: InsertFollow): Promise<Follow> {
    const [follow] = await db.insert(schema.follows).values(followData).returning();
    return follow;
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(schema.follows)
      .where(and(eq(schema.follows.followerId, followerId), eq(schema.follows.followingId, followingId)));
  }

  // View Tracking
  async getViewTracking(userId: string, type: string, identifier: string): Promise<ViewTracking | undefined> {
    const [tracking] = await db
      .select()
      .from(schema.viewTracking)
      .where(and(eq(schema.viewTracking.userId, userId), eq(schema.viewTracking.type, type), eq(schema.viewTracking.identifier, identifier)));
    return tracking;
  }

  async updateViewTracking(userId: string, type: string, identifier: string): Promise<ViewTracking> {
    const existing = await this.getViewTracking(userId, type, identifier);

    if (existing) {
      const [updated] = await db
        .update(schema.viewTracking)
        .set({ lastViewedAt: new Date() })
        .where(eq(schema.viewTracking.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(schema.viewTracking)
      .values({ userId, type, identifier, lastViewedAt: new Date() })
      .returning();
    return created;
  }

  // Saved Trends
  async isTrendSaved(userId: string, trendId: string): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(schema.savedTrends)
      .where(and(eq(schema.savedTrends.userId, userId), eq(schema.savedTrends.trendId, trendId)));
    return !!saved;
  }

  async saveTrend(userId: string, trendId: string): Promise<SavedTrend> {
    const [saved] = await db.insert(schema.savedTrends).values({ userId, trendId }).returning();
    return saved;
  }

  async unsaveTrend(userId: string, trendId: string): Promise<void> {
    await db
      .delete(schema.savedTrends)
      .where(and(eq(schema.savedTrends.userId, userId), eq(schema.savedTrends.trendId, trendId)));
  }

  async getSavedTrends(userId: string): Promise<Trend[]> {
    const saved = await db
      .select()
      .from(schema.savedTrends)
      .where(eq(schema.savedTrends.userId, userId));

    if (!saved.length) return [];

    const trendIds = saved.map((s) => s.trendId);
    return await db.select().from(schema.trends).where(inArray(schema.trends.id, trendIds));
  }

  // Saved Posts
  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(schema.savedPosts)
      .where(and(eq(schema.savedPosts.userId, userId), eq(schema.savedPosts.postId, postId)));
    return !!saved;
  }

  async savePost(userId: string, postId: string): Promise<SavedPost> {
    const [saved] = await db.insert(schema.savedPosts).values({ userId, postId }).returning();
    return saved;
  }

  async unsavePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(schema.savedPosts)
      .where(and(eq(schema.savedPosts.userId, userId), eq(schema.savedPosts.postId, postId)));
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    const saved = await db
      .select()
      .from(schema.savedPosts)
      .where(eq(schema.savedPosts.userId, userId));

    if (!saved.length) return [];

    const postIds = saved.map((s) => s.postId);
    return await db.select().from(schema.posts).where(inArray(schema.posts.id, postIds));
  }

  // Notifications
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(schema.notifications).values(notificationData).returning();
    return notification;
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, 0)));
    return Number(result[0]?.count || 0);
  }

  async markAsRead(id: string): Promise<void> {
    await db.update(schema.notifications).set({ isRead: 1 }).where(eq(schema.notifications.id, id));
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(schema.notifications).set({ isRead: 1 }).where(eq(schema.notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(schema.notifications).where(eq(schema.notifications.id, id));
  }

  async getNewContentCounts(userId: string): Promise<any> {
    const unreadNotifications = await this.getUnreadCount(userId);
    return { unreadNotifications };
  }

  // OneSignal Subscriptions
  async saveOneSignalSubscription(subscriptionData: InsertOneSignalSubscription): Promise<OneSignalSubscription> {
    const [subscription] = await db.insert(schema.oneSignalSubscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async getOneSignalSubscription(userId: string): Promise<OneSignalSubscription | undefined> {
    const [sub] = await db
      .select()
      .from(schema.oneSignalSubscriptions)
      .where(and(eq(schema.oneSignalSubscriptions.userId, userId), eq(schema.oneSignalSubscriptions.isActive, 1)));
    return sub;
  }

  // Email Verification Codes
  async createVerificationCode(email: string, code: string, expiresAt: Date): Promise<EmailVerificationCode> {
    const [record] = await db
      .insert(schema.emailVerificationCodes)
      .values({ email, code, expiresAt })
      .returning();
    return record;
  }

  async getVerificationCode(code: string): Promise<EmailVerificationCode | undefined> {
    const [record] = await db
      .select()
      .from(schema.emailVerificationCodes)
      .where(eq(schema.emailVerificationCodes.code, code));
    return record;
  }

  async deleteVerificationCode(code: string): Promise<void> {
    await db.delete(schema.emailVerificationCodes).where(eq(schema.emailVerificationCodes.code, code));
  }

  // Disqualification
  async disqualifyUser(userId: string, trendId: string): Promise<void> {
    // Mark user's posts in trend as disqualified by setting isDisqualified=1
    await db
      .update(schema.posts)
      .set({ isDisqualified: 1 })
      .where(and(eq(schema.posts.userId, userId), eq(schema.posts.trendId, trendId)));
  }

  async isUserDisqualified(userId: string, trendId: string): Promise<boolean> {
    const posts = await db
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.userId, userId), eq(schema.posts.trendId, trendId)));
    return posts.some((p) => p.isDisqualified === 1);
  }

  // Analytics
  async trackTrendView(userId: string, trendId: string): Promise<void> {
    const existing = await this.getViewTracking(userId, "trend", trendId);

    if (!existing) {
      await db
        .update(schema.trends)
        .set({ views: sql`${schema.trends.views} + 1` })
        .where(eq(schema.trends.id, trendId));
    }

    await this.updateViewTracking(userId, "trend", trendId);
  }

  async incrementPostCommentCount(postId: string): Promise<void> {
    await db.update(schema.posts).set({ commentCount: sql`COALESCE(${schema.posts.commentCount}, 0) + 1` }).where(eq(schema.posts.id, postId));
  }

  async decrementPostCommentCount(postId: string): Promise<void> {
    await db.update(schema.posts).set({ commentCount: sql`GREATEST(COALESCE(${schema.posts.commentCount}, 0) - 1, 0)` }).where(eq(schema.posts.id, postId));
  }

  async incrementTrendChatCount(trendId: string): Promise<void> {
    await db.update(schema.trends).set({ chatCount: sql`COALESCE(${schema.trends.chatCount}, 0) + 1` }).where(eq(schema.trends.id, trendId));
  }

  async decrementTrendChatCount(trendId: string): Promise<void> {
    await db.update(schema.trends).set({ chatCount: sql`GREATEST(COALESCE(${schema.trends.chatCount}, 0) - 1, 0)` }).where(eq(schema.trends.id, trendId));
  }

  async getTrendAnalytics(trendId: string): Promise<any> {
    const posts = await this.getPostsByTrend(trendId);
    const uniqueParticipants = new Set(posts.map((p) => p.userId)).size;
    const totalVotes = posts.reduce((sum, p) => sum + (p.votes || 0), 0);

    const trend = await this.getTrend(trendId);

    return {
      trendId,
      trendName: trend?.name || "Unknown",
      views: trend?.views || 0,
      participants: uniqueParticipants,
      totalPosts: posts.length,
      totalVotes,
    };
  }
}

export const storage = new DatabaseStorage();
