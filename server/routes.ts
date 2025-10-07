import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, sanitizeUser, requireAuth } from "./auth";
import { 
  insertUserSchema, 
  insertTrendSchema, 
  insertPostSchema, 
  insertVoteSchema, 
  insertCommentSchema, 
  insertFollowSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  
  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { username, password } = result.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      req.session.userId = user.id;

      res.status(201).json({ user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { username, password } = result.data;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;

      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Trends routes

  // GET /api/trends - Get all trends (optional category query param)
  app.get("/api/trends", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const trends = await storage.getAllTrends(category);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/trends/:id - Get single trend with creator info
  app.get("/api/trends/:id", async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.id);
      
      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      const creator = await storage.getUser(trend.userId);
      res.json({ ...trend, creator: creator ? sanitizeUser(creator) : null });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/trends - Create trend (protected)
  app.post("/api/trends", requireAuth, async (req, res) => {
    try {
      const result = insertTrendSchema.safeParse({
        ...req.body,
        userId: req.session.userId,
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }

      const trend = await storage.createTrend(result.data);
      res.status(201).json(trend);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/trends/:id - Update trend (protected, only trend creator)
  app.patch("/api/trends/:id", requireAuth, async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.id);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      if (trend.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden: You can only update your own trends" });
      }

      const updatedTrend = await storage.updateTrend(req.params.id, req.body);
      res.json(updatedTrend);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/trends/:id - Delete trend (protected, only trend creator)
  app.delete("/api/trends/:id", requireAuth, async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.id);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      if (trend.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own trends" });
      }

      await storage.deleteTrend(req.params.id);
      res.json({ message: "Trend deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/trends/user/:userId - Get trends by user
  app.get("/api/trends/user/:userId", async (req, res) => {
    try {
      const trends = await storage.getTrendsByUser(req.params.userId);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Posts routes

  // GET /api/posts/trend/:trendId - Get all posts for a trend
  app.get("/api/posts/trend/:trendId", async (req, res) => {
    try {
      const posts = await storage.getPostsByTrend(req.params.trendId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/posts - Create post (protected)
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const result = insertPostSchema.safeParse({
        ...req.body,
        userId: req.session.userId,
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }

      const post = await storage.createPost(result.data);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/posts/:id/disqualify - Disqualify post (protected, only trend creator)
  app.patch("/api/posts/:id/disqualify", requireAuth, async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const trend = await storage.getTrend(post.trendId);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      if (trend.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden: Only the trend creator can disqualify posts" });
      }

      const updatedPost = await storage.updatePost(req.params.id, { isDisqualified: 1 });
      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Votes routes

  // POST /api/votes - Add vote to post (protected, check 10-vote limit per trend)
  app.post("/api/votes", requireAuth, async (req, res) => {
    try {
      const result = insertVoteSchema.safeParse({
        ...req.body,
        userId: req.session.userId,
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }

      // Check if user has already voted for this post
      const existingVote = await storage.getVote(result.data.postId, req.session.userId!);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted for this post" });
      }

      // Check 10-vote limit per trend
      const userVotes = await storage.getVotesByUser(req.session.userId!, result.data.trendId);
      if (userVotes.length >= 10) {
        return res.status(400).json({ message: "You have reached the maximum of 10 votes for this trend" });
      }

      const vote = await storage.createVote(result.data);
      res.status(201).json(vote);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/votes/:postId - Remove vote from post (protected)
  app.delete("/api/votes/:postId", requireAuth, async (req, res) => {
    try {
      const vote = await storage.getVote(req.params.postId, req.session.userId!);

      if (!vote) {
        return res.status(404).json({ message: "Vote not found" });
      }

      await storage.deleteVote(req.params.postId, req.session.userId!);
      res.json({ message: "Vote removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/votes/trend/:trendId/count - Get user's vote count for trend (protected)
  app.get("/api/votes/trend/:trendId/count", requireAuth, async (req, res) => {
    try {
      const votes = await storage.getVotesByUser(req.session.userId!, req.params.trendId);
      res.json({ count: votes.length });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comments routes

  // GET /api/comments/post/:postId - Get comments for post
  app.get("/api/comments/post/:postId", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/comments/trend/:trendId - Get comments for trend chat
  app.get("/api/comments/trend/:trendId", async (req, res) => {
    try {
      const comments = await storage.getCommentsByTrend(req.params.trendId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/comments - Create comment (protected)
  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const result = insertCommentSchema.safeParse({
        ...req.body,
        userId: req.session.userId,
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }

      const comment = await storage.createComment(result.data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Follows routes

  // POST /api/follows - Follow user (protected)
  app.post("/api/follows", requireAuth, async (req, res) => {
    try {
      const result = insertFollowSchema.safeParse({
        followerId: req.session.userId,
        followingId: req.body.followingId,
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }

      if (result.data.followerId === result.data.followingId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }

      // Check if already following
      const existingFollow = await storage.getFollow(result.data.followerId, result.data.followingId);
      if (existingFollow) {
        return res.status(400).json({ message: "You are already following this user" });
      }

      const follow = await storage.createFollow(result.data);
      res.status(201).json(follow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/follows/:userId - Unfollow user (protected)
  app.delete("/api/follows/:userId", requireAuth, async (req, res) => {
    try {
      const follow = await storage.getFollow(req.session.userId!, req.params.userId);

      if (!follow) {
        return res.status(404).json({ message: "Follow relationship not found" });
      }

      await storage.deleteFollow(req.session.userId!, req.params.userId);
      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/follows/:userId/status - Check if current user follows another user (protected)
  app.get("/api/follows/:userId/status", requireAuth, async (req, res) => {
    try {
      const follow = await storage.getFollow(req.session.userId!, req.params.userId);
      res.json({ isFollowing: !!follow });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Users routes

  // GET /api/users/:username - Get user by username
  app.get("/api/users/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(sanitizeUser(user));
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/users/profile - Update current user profile (protected)
  app.patch("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const { bio, profilePicture, instagramUrl, tiktokUrl, twitterUrl, youtubeUrl, categories, role } = req.body;

      const updatedUser = await storage.updateUser(req.session.userId!, {
        bio,
        profilePicture,
        instagramUrl,
        tiktokUrl,
        twitterUrl,
        youtubeUrl,
        categories,
        role,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
