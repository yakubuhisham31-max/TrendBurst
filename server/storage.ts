import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { eq, and, desc, sql } from "drizzle-orm";
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
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Trends
  getTrend(id: string): Promise<Trend | undefined>;
  getAllTrends(category?: string): Promise<Trend[]>;
  getTrendsByUser(userId: string): Promise<Trend[]>;
  createTrend(trend: InsertTrend): Promise<Trend>;
  updateTrend(id: string, data: Partial<Trend>): Promise<Trend | undefined>;
  deleteTrend(id: string): Promise<void>;
  
  // Posts
  getPost(id: string): Promise<Post | undefined>;
  getPostsByTrend(trendId: string): Promise<Post[]>;
  getPostsByUser(userId: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, data: Partial<Post>): Promise<Post | undefined>;
  
  // Votes
  getVote(postId: string, userId: string): Promise<Vote | undefined>;
  getVotesByUser(userId: string, trendId: string): Promise<Vote[]>;
  createVote(vote: InsertVote): Promise<Vote>;
  deleteVote(postId: string, userId: string): Promise<void>;
  
  // Comments
  getComment(id: string): Promise<Comment | undefined>;
  getCommentsByPost(postId: string): Promise<Comment[]>;
  getCommentsByTrend(trendId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Follows
  getFollow(followerId: string, followingId: string): Promise<Follow | undefined>;
  getFollowers(userId: string): Promise<Follow[]>;
  getFollowing(userId: string): Promise<Follow[]>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning();
    return result[0];
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
    const result = await db.insert(schema.trends).values(trend).returning();
    return result[0];
  }

  async updateTrend(id: string, data: Partial<Trend>): Promise<Trend | undefined> {
    const result = await db.update(schema.trends).set(data).where(eq(schema.trends.id, id)).returning();
    return result[0];
  }

  async deleteTrend(id: string): Promise<void> {
    await db.delete(schema.trends).where(eq(schema.trends.id, id));
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

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(schema.posts).values(post).returning();
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

  // Comments
  async getComment(id: string): Promise<Comment | undefined> {
    const result = await db.select().from(schema.comments).where(eq(schema.comments.id, id));
    return result[0];
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return await db.select().from(schema.comments).where(eq(schema.comments.postId, postId)).orderBy(desc(schema.comments.createdAt));
  }

  async getCommentsByTrend(trendId: string): Promise<Comment[]> {
    return await db.select().from(schema.comments).where(eq(schema.comments.trendId, trendId)).orderBy(desc(schema.comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(schema.comments).values(comment).returning();
    if (comment.trendId) {
      await db.update(schema.trends).set({ chatCount: sql`${schema.trends.chatCount} + 1` }).where(eq(schema.trends.id, comment.trendId));
    }
    return result[0];
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
}

export const storage = new DbStorage();
