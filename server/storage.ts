import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import * as schema from "@shared/schema";
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
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
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
  
  // Votes
  getVote(postId: string, userId: string): Promise<Vote | undefined>;
  getVotesByUser(userId: string, trendId: string): Promise<Vote[]>;
  createVote(vote: InsertVote): Promise<Vote>;
  deleteVote(postId: string, userId: string): Promise<void>;
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
  trackTrendView(userId: string, trendId: string): Promise<void>;
  getNewContentCounts(userId: string): Promise<{ category: Record<string, number>, chat: Record<string, number> }>;
  
  // Saved Items
  saveTrend(userId: string, trendId: string): Promise<SavedTrend>;
  unsaveTrend(userId: string, trendId: string): Promise<void>;
  isTrendSaved(userId: string, trendId: string): Promise<boolean>;
  getSavedTrends(userId: string): Promise<Trend[]>;
  savePost(userId: string, postId: string): Promise<SavedPost>;
  unsavePost(userId: string, postId: string): Promise<void>;
  isPostSaved(userId: string, postId: string): Promise<boolean>;
  getSavedPosts(userId: string): Promise<Post[]>;
  deletePost(id: string): Promise<void>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string, limit?: number): Promise<Array<Notification & { actor: User | null }>>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getNotificationTracking(userId: string, type: string): Promise<any>;
  recordNotificationSent(userId: string, type: string, variant?: number): Promise<void>;

  // OneSignal Subscriptions
  saveOneSignalSubscription(subscription: InsertOneSignalSubscription): Promise<OneSignalSubscription>;
  getOneSignalSubscription(userId: string): Promise<OneSignalSubscription | undefined>;
  getActiveOneSignalSubscriptions(limit?: number): Promise<OneSignalSubscription[]>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.googleId, googleId));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async upsertUser(userData: Partial<User>): Promise<User> {
    if (!userData.id) throw new Error("User ID is required");
    
    // Check if user already exists by email
    if (userData.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        // Update existing user
        const updatedData = {
          profilePicture: userData.profilePicture,
          fullName: userData.fullName,
        };
        const result = await db
          .update(schema.users)
          .set(updatedData)
          .where(eq(schema.users.id, existingUser.id))
          .returning();
        return result[0];
      }
    }
    
    // Map Replit Auth fields to existing schema
    const mappedData = {
      id: userData.id,
      email: userData.email,
      username: userData.username || `user_${userData.id.substring(0, 8)}`,
      fullName: userData.fullName || userData.email?.split("@")[0],
      profilePicture: userData.profilePicture,
    };
    
    const result = await db
      .insert(schema.users)
      .values(mappedData as any)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: mappedData as any,
      })
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  // Trends
  async getTrend(id: string): Promise<Trend | undefined> {
    const result = await db.select().from(schema.trends).where(eq(schema.trends.id, id));
    return result[0];
  }

  async getAllTrends(category?: string): Promise<Trend[]> {
    if (category) {
      return await db.select().from(schema.trends).where(eq(schema.trends.category, category)).orderBy(desc(schema.trends.createdAt));
    }
    return await db.select().from(schema.trends).orderBy(desc(schema.trends.createdAt));
  }

  async getTrendsByUser(userId: string): Promise<Trend[]> {
    return await db.select().from(schema.trends).where(eq(schema.trends.userId, userId)).orderBy(desc(schema.trends.createdAt));
  }

  async createTrend(trend: InsertTrend): Promise<Trend> {
    const trendData = {
      ...trend,
      endDate: typeof trend.endDate === 'string' ? new Date(trend.endDate) : trend.endDate,
    };
    const result = await db.insert(schema.trends).values(trendData).returning();
    return result[0];
  }

  async updateTrend(id: string, data: Partial<Trend>): Promise<Trend | undefined> {
    const result = await db.update(schema.trends).set(data).where(eq(schema.trends.id, id)).returning();
    return result[0];
  }

  async deleteTrend(id: string): Promise<void> {
    // Delete all related data first
    // Delete comments for this trend (both trend-level chats and post comments)
    await db.delete(schema.comments).where(eq(schema.comments.trendId, id));
    
    // Get all posts for this trend so we can delete their related data
    const posts = await db.select().from(schema.posts).where(eq(schema.posts.trendId, id));
    const postIds = posts.map(p => p.id);
    
    if (postIds.length > 0) {
      // Delete notifications for all posts in this trend
      for (const postId of postIds) {
        await db.delete(schema.notifications).where(eq(schema.notifications.postId, postId));
      }
      
      // Delete votes for all posts in this trend
      for (const postId of postIds) {
        await db.delete(schema.votes).where(eq(schema.votes.postId, postId));
        await db.delete(schema.savedPosts).where(eq(schema.savedPosts.postId, postId));
      }
      
      // Delete all posts for this trend
      await db.delete(schema.posts).where(eq(schema.posts.trendId, id));
    }
    
    // Delete notifications for this trend
    await db.delete(schema.notifications).where(eq(schema.notifications.trendId, id));
    
    // Delete saved trends
    await db.delete(schema.savedTrends).where(eq(schema.savedTrends.trendId, id));
    
    // Delete view tracking for this trend
    await db.delete(schema.viewTracking).where(and(
      eq(schema.viewTracking.type, 'chat'),
      eq(schema.viewTracking.identifier, id)
    ));
    
    // Finally delete the trend itself
    await db.delete(schema.trends).where(eq(schema.trends.id, id));
  }

  async incrementTrendParticipants(trendId: string): Promise<void> {
    await db.update(schema.trends).set({ participants: sql`${schema.trends.participants} + 1` }).where(eq(schema.trends.id, trendId));
  }

  async decrementTrendParticipants(trendId: string): Promise<void> {
    await db.update(schema.trends).set({ participants: sql`${schema.trends.participants} - 1` }).where(eq(schema.trends.id, trendId));
  }

  // Posts
  async getPost(id: string): Promise<Post | undefined> {
    const result = await db.select().from(schema.posts).where(eq(schema.posts.id, id));
    return result[0];
  }

  async getPostsByTrend(trendId: string): Promise<Post[]> {
    return await db.select().from(schema.posts).where(eq(schema.posts.trendId, trendId)).orderBy(desc(schema.posts.votes));
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    return await db.select().from(schema.posts).where(eq(schema.posts.userId, userId)).orderBy(desc(schema.posts.createdAt));
  }

  async getRankedPostsForTrend(trendId: string): Promise<Array<Post & { user: User }>> {
    const posts = await db.select()
      .from(schema.posts)
      .where(and(eq(schema.posts.trendId, trendId), eq(schema.posts.isDisqualified, 0)))
      .orderBy(desc(schema.posts.votes));
    
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await this.getUser(post.userId);
        return { ...post, user: user! };
      })
    );
    
    return postsWithUsers;
  }

  async createPost(post: InsertPost): Promise<Post> {
    // Support backwards compatibility: use mediaUrl if provided, otherwise use imageUrl
    const postData = {
      ...post,
      mediaUrl: post.mediaUrl || post.imageUrl || '',
      mediaType: post.mediaType || 'image',
      imageUrl: post.imageUrl || post.mediaUrl || '', // Keep imageUrl for backwards compat
    };
    const result = await db.insert(schema.posts).values(postData).returning();
    return result[0];
  }

  async updatePost(id: string, data: Partial<Post>): Promise<Post | undefined> {
    const result = await db.update(schema.posts).set(data).where(eq(schema.posts.id, id)).returning();
    return result[0];
  }

  // Votes
  async getVote(postId: string, userId: string): Promise<Vote | undefined> {
    const result = await db.select().from(schema.votes).where(and(eq(schema.votes.postId, postId), eq(schema.votes.userId, userId)));
    return result[0];
  }

  async getVotesByUser(userId: string, trendId: string): Promise<Vote[]> {
    return await db.select().from(schema.votes).where(and(eq(schema.votes.userId, userId), eq(schema.votes.trendId, trendId)));
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const result = await db.insert(schema.votes).values(vote).returning();
    await db.update(schema.posts).set({ votes: sql`${schema.posts.votes} + 1` }).where(eq(schema.posts.id, vote.postId));
    return result[0];
  }

  async deleteVote(postId: string, userId: string): Promise<void> {
    await db.delete(schema.votes).where(and(eq(schema.votes.postId, postId), eq(schema.votes.userId, userId)));
    await db.update(schema.posts).set({ votes: sql`${schema.posts.votes} - 1` }).where(eq(schema.posts.id, postId));
  }

  async incrementVote(postId: string, userId: string, trendId: string): Promise<Vote> {
    const existingVote = await this.getVote(postId, userId);
    
    if (existingVote) {
      const result = await db
        .update(schema.votes)
        .set({ count: sql`${schema.votes.count} + 1` })
        .where(and(eq(schema.votes.postId, postId), eq(schema.votes.userId, userId)))
        .returning();
      await db.update(schema.posts).set({ votes: sql`${schema.posts.votes} + 1` }).where(eq(schema.posts.id, postId));
      return result[0];
    } else {
      const result = await db.insert(schema.votes).values({ postId, userId, trendId, count: 1 }).returning();
      await db.update(schema.posts).set({ votes: sql`${schema.posts.votes} + 1` }).where(eq(schema.posts.id, postId));
      return result[0];
    }
  }

  async decrementVote(postId: string, userId: string): Promise<Vote | null> {
    const existingVote = await this.getVote(postId, userId);
    
    if (!existingVote) {
      return null;
    }
    
    if (existingVote.count <= 1) {
      await db.delete(schema.votes).where(and(eq(schema.votes.postId, postId), eq(schema.votes.userId, userId)));
      await db.update(schema.posts).set({ votes: sql`${schema.posts.votes} - 1` }).where(eq(schema.posts.id, postId));
      return null;
    } else {
      const result = await db
        .update(schema.votes)
        .set({ count: sql`${schema.votes.count} - 1` })
        .where(and(eq(schema.votes.postId, postId), eq(schema.votes.userId, userId)))
        .returning();
      await db.update(schema.posts).set({ votes: sql`${schema.posts.votes} - 1` }).where(eq(schema.posts.id, postId));
      return result[0];
    }
  }

  // Comments
  async getComment(id: string): Promise<Comment | undefined> {
    const result = await db.select().from(schema.comments).where(eq(schema.comments.id, id));
    return result[0];
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return await db.select().from(schema.comments).where(eq(schema.comments.postId, postId)).orderBy(desc(schema.comments.createdAt));
  }

  async getCommentsByTrend(trendId: string): Promise<Comment[]> {
    return await db.select().from(schema.comments).where(
      and(
        eq(schema.comments.trendId, trendId),
        isNull(schema.comments.postId)
      )
    ).orderBy(desc(schema.comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(schema.comments).values(comment).returning();
    if (comment.trendId) {
      await db.update(schema.trends).set({ chatCount: sql`${schema.trends.chatCount} + 1` }).where(eq(schema.trends.id, comment.trendId));
    }
    if (comment.postId) {
      await db.update(schema.posts).set({ commentCount: sql`${schema.posts.commentCount} + 1` }).where(eq(schema.posts.id, comment.postId));
    }
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    const comment = await this.getComment(id);
    if (comment) {
      await db.delete(schema.comments).where(eq(schema.comments.id, id));
      if (comment.trendId) {
        await db.update(schema.trends).set({ chatCount: sql`${schema.trends.chatCount} - 1` }).where(eq(schema.trends.id, comment.trendId));
      }
      if (comment.postId) {
        await db.update(schema.posts).set({ commentCount: sql`${schema.posts.commentCount} - 1` }).where(eq(schema.posts.id, comment.postId));
      }
    }
  }

  // Follows
  async getFollow(followerId: string, followingId: string): Promise<Follow | undefined> {
    const result = await db.select().from(schema.follows).where(and(eq(schema.follows.followerId, followerId), eq(schema.follows.followingId, followingId)));
    return result[0];
  }

  async getFollowers(userId: string): Promise<Follow[]> {
    return await db.select().from(schema.follows).where(eq(schema.follows.followingId, userId));
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    return await db.select().from(schema.follows).where(eq(schema.follows.followerId, userId));
  }

  async createFollow(follow: InsertFollow): Promise<Follow> {
    const result = await db.insert(schema.follows).values(follow).returning();
    await db.update(schema.users).set({ followers: sql`${schema.users.followers} + 1` }).where(eq(schema.users.id, follow.followingId));
    await db.update(schema.users).set({ following: sql`${schema.users.following} + 1` }).where(eq(schema.users.id, follow.followerId));
    return result[0];
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await db.delete(schema.follows).where(and(eq(schema.follows.followerId, followerId), eq(schema.follows.followingId, followingId)));
    await db.update(schema.users).set({ followers: sql`${schema.users.followers} - 1` }).where(eq(schema.users.id, followingId));
    await db.update(schema.users).set({ following: sql`${schema.users.following} - 1` }).where(eq(schema.users.id, followerId));
  }

  // View Tracking
  async getViewTracking(userId: string, type: string, identifier: string): Promise<ViewTracking | undefined> {
    const result = await db.select().from(schema.viewTracking).where(
      and(
        eq(schema.viewTracking.userId, userId),
        eq(schema.viewTracking.type, type),
        eq(schema.viewTracking.identifier, identifier)
      )
    );
    return result[0];
  }

  async updateViewTracking(userId: string, type: string, identifier: string): Promise<ViewTracking> {
    const existing = await this.getViewTracking(userId, type, identifier);
    
    if (existing) {
      const result = await db
        .update(schema.viewTracking)
        .set({ lastViewedAt: new Date() })
        .where(eq(schema.viewTracking.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(schema.viewTracking).values({ userId, type, identifier }).returning();
      return result[0];
    }
  }

  async trackTrendView(userId: string, trendId: string): Promise<void> {
    const existing = await this.getViewTracking(userId, 'trend', trendId);
    
    if (!existing) {
      await db.insert(schema.viewTracking).values({ userId, type: 'trend', identifier: trendId });
      await db.update(schema.trends).set({ views: sql`${schema.trends.views} + 1` }).where(eq(schema.trends.id, trendId));
    } else {
      await db
        .update(schema.viewTracking)
        .set({ lastViewedAt: new Date() })
        .where(eq(schema.viewTracking.id, existing.id));
    }
  }

  async getNewContentCounts(userId: string): Promise<{ category: Record<string, number>, chat: Record<string, number> }> {
    const categoryCounts: Record<string, number> = {};
    const chatCounts: Record<string, number> = {};
    
    // Get all view tracking records for this user
    const viewRecords = await db.select().from(schema.viewTracking).where(eq(schema.viewTracking.userId, userId));
    
    // Count new trends per category
    const categoryRecords = viewRecords.filter(r => r.type === 'category');
    const categories = ['AI', 'Arts', 'Entertainment', 'Fashion', 'Food', 'Gaming', 'Photography', 'Sports', 'Technology', 'Other'];
    
    for (const category of categories) {
      const record = categoryRecords.find(r => r.identifier === category);
      const lastViewed = record?.lastViewedAt || new Date(0);
      const newTrends = await db.select().from(schema.trends).where(
        and(
          eq(schema.trends.category, category),
          sql`${schema.trends.createdAt} > ${lastViewed}`
        )
      );
      categoryCounts[category] = newTrends.length;
    }
    
    // Count new chat messages per trend
    const chatRecords = viewRecords.filter(r => r.type === 'chat');
    for (const record of chatRecords) {
      const lastViewed = record.lastViewedAt || new Date(0);
      const newMessages = await db.select().from(schema.comments).where(
        and(
          eq(schema.comments.trendId, record.identifier),
          isNull(schema.comments.postId),
          sql`${schema.comments.createdAt} > ${lastViewed}`
        )
      );
      chatCounts[record.identifier] = newMessages.length;
    }
    
    return { category: categoryCounts, chat: chatCounts };
  }

  // Saved Items
  async saveTrend(userId: string, trendId: string): Promise<SavedTrend> {
    const result = await db.insert(schema.savedTrends).values({ userId, trendId }).returning();
    return result[0];
  }

  async unsaveTrend(userId: string, trendId: string): Promise<void> {
    await db.delete(schema.savedTrends).where(and(eq(schema.savedTrends.userId, userId), eq(schema.savedTrends.trendId, trendId)));
  }

  async isTrendSaved(userId: string, trendId: string): Promise<boolean> {
    const result = await db.select().from(schema.savedTrends).where(and(eq(schema.savedTrends.userId, userId), eq(schema.savedTrends.trendId, trendId)));
    return result.length > 0;
  }

  async getSavedTrends(userId: string): Promise<Trend[]> {
    const savedRecords = await db.select().from(schema.savedTrends).where(eq(schema.savedTrends.userId, userId)).orderBy(desc(schema.savedTrends.createdAt));
    const trends = await Promise.all(
      savedRecords.map(async (record) => {
        const trend = await this.getTrend(record.trendId);
        return trend!;
      })
    );
    return trends.filter(t => t !== undefined);
  }

  async savePost(userId: string, postId: string): Promise<SavedPost> {
    const result = await db.insert(schema.savedPosts).values({ userId, postId }).returning();
    return result[0];
  }

  async unsavePost(userId: string, postId: string): Promise<void> {
    await db.delete(schema.savedPosts).where(and(eq(schema.savedPosts.userId, userId), eq(schema.savedPosts.postId, postId)));
  }

  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    const result = await db.select().from(schema.savedPosts).where(and(eq(schema.savedPosts.userId, userId), eq(schema.savedPosts.postId, postId)));
    return result.length > 0;
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    const savedRecords = await db.select().from(schema.savedPosts).where(eq(schema.savedPosts.userId, userId)).orderBy(desc(schema.savedPosts.createdAt));
    const posts = await Promise.all(
      savedRecords.map(async (record) => {
        const post = await this.getPost(record.postId);
        return post!;
      })
    );
    return posts.filter(p => p !== undefined);
  }

  async deletePost(id: string): Promise<void> {
    // Delete all related data first - ORDER MATTERS for foreign keys!
    
    // Step 1: Get all comment IDs for this post (we'll need them for notifications)
    const comments = await db.select({ id: schema.comments.id }).from(schema.comments).where(eq(schema.comments.postId, id));
    const commentIds = comments.map(c => c.id);
    
    // Step 2: Delete notifications that reference these comments (before deleting comments)
    if (commentIds.length > 0) {
      await db.delete(schema.notifications).where(
        sql`${schema.notifications.commentId} IN (${sql.join(commentIds)})`
      );
    }
    
    // Step 3: Delete votes for this post
    await db.delete(schema.votes).where(eq(schema.votes.postId, id));
    
    // Step 4: Delete comments for this post
    await db.delete(schema.comments).where(eq(schema.comments.postId, id));
    
    // Step 5: Delete saved post records
    await db.delete(schema.savedPosts).where(eq(schema.savedPosts.postId, id));
    
    // Step 6: Delete notifications related to this post
    await db.delete(schema.notifications).where(eq(schema.notifications.postId, id));
    
    // Step 7: Finally delete the post itself
    await db.delete(schema.posts).where(eq(schema.posts.id, id));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(schema.notifications).values(notification).returning();
    return result[0];
  }

  async getNotifications(userId: string, limit: number = 50): Promise<Array<Notification & { actor: User | null }>> {
    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);
    
    // Fetch actor details for each notification
    const notificationsWithActor = await Promise.all(
      notifications.map(async (notif) => {
        const actor = notif.actorId ? await this.getUser(notif.actorId) : null;
        return { ...notif, actor: actor || null };
      })
    );
    
    return notificationsWithActor;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, 0)));
    
    return result[0]?.count || 0;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await db
      .update(schema.notifications)
      .set({ isRead: 1 })
      .where(eq(schema.notifications.id, notificationId));
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(schema.notifications)
      .set({ isRead: 1 })
      .where(eq(schema.notifications.userId, userId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(schema.notifications).where(eq(schema.notifications.id, notificationId));
  }

  async getNotificationTracking(userId: string, type: string): Promise<any> {
    try {
      const result = await db
        .select()
        .from(schema.notificationTracking)
        .where(and(eq(schema.notificationTracking.userId, userId), eq(schema.notificationTracking.type, type)));
      return result[0];
    } catch {
      return null;
    }
  }

  async recordNotificationSent(userId: string, type: string, variant: number = 0): Promise<void> {
    try {
      const existing = await this.getNotificationTracking(userId, type);
      const now = new Date();

      if (existing) {
        const lastSent = new Date(existing.lastSentAt);
        const daysDiff = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));
        const newCount = daysDiff >= 1 ? 1 : (existing.countToday || 0) + 1;

        await db.update(schema.notificationTracking)
          .set({ lastSentAt: now, countToday: newCount, lastVariant: variant })
          .where(and(eq(schema.notificationTracking.userId, userId), eq(schema.notificationTracking.type, type)));
      } else {
        await db.insert(schema.notificationTracking).values({
          userId,
          type,
          lastSentAt: now,
          countToday: 1,
          lastVariant: variant,
        });
      }
    } catch (error) {
      console.error("Failed to record notification sent:", error);
    }
  }

  // OneSignal Subscriptions
  async saveOneSignalSubscription(subscription: InsertOneSignalSubscription): Promise<OneSignalSubscription> {
    const existing = await db
      .select()
      .from(schema.oneSignalSubscriptions)
      .where(eq(schema.oneSignalSubscriptions.userId, subscription.userId));

    if (existing.length > 0) {
      // Update existing subscription
      const result = await db
        .update(schema.oneSignalSubscriptions)
        .set({ ...subscription, updatedAt: new Date() })
        .where(eq(schema.oneSignalSubscriptions.userId, subscription.userId))
        .returning();
      return result[0];
    } else {
      // Insert new subscription
      const result = await db
        .insert(schema.oneSignalSubscriptions)
        .values(subscription)
        .returning();
      return result[0];
    }
  }

  async getOneSignalSubscription(userId: string): Promise<OneSignalSubscription | undefined> {
    const result = await db
      .select()
      .from(schema.oneSignalSubscriptions)
      .where(eq(schema.oneSignalSubscriptions.userId, userId));
    return result[0];
  }

  async getActiveOneSignalSubscriptions(limit: number = 100): Promise<OneSignalSubscription[]> {
    const result = await db
      .select()
      .from(schema.oneSignalSubscriptions)
      .where(eq(schema.oneSignalSubscriptions.isActive, 1))
      .limit(limit);
    return result;
  }
}

export const storage = new DbStorage();
