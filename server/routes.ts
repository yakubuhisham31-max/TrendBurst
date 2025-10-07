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
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

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
      
      // Include creator info for each trend
      const trendsWithCreators = await Promise.all(
        trends.map(async (trend) => {
          const creator = await storage.getUser(trend.userId);
          return {
            ...trend,
            creator: creator ? sanitizeUser(creator) : null,
          };
        })
      );
      
      res.json(trendsWithCreators);
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

  // GET /api/dashboard/stats - Get dashboard statistics for current user (protected)
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userTrends = await storage.getTrendsByUser(userId);
      const trendsCreated = userTrends.length;
      const activeTrends = userTrends.filter(t => !t.endDate).length;

      let totalPosts = 0;
      let uniqueParticipants = new Set<string>();

      for (const trend of userTrends) {
        const posts = await storage.getPostsByTrend(trend.id);
        totalPosts += posts.length;
        posts.forEach((post) => uniqueParticipants.add(post.userId));
      }

      res.json({
        trendsCreated,
        totalParticipants: uniqueParticipants.size,
        totalPosts,
        activeTrends,
        trendxPoints: user.trendxPoints || 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/trends/:id/end - End trend and award points (protected, only trend creator)
  app.post("/api/trends/:id/end", requireAuth, async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.id);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      if (trend.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden: Only the trend creator can end this trend" });
      }

      if (trend.endDate) {
        return res.status(400).json({ message: "This trend has already ended" });
      }

      // Mark trend as ended
      const endedTrend = await storage.updateTrend(req.params.id, {
        endDate: new Date(),
      });

      // Get ranked posts (excluding disqualified)
      const rankedPosts = await storage.getRankedPostsForTrend(req.params.id);

      // Award bonus points to top 3
      const bonusPoints = [150, 100, 50];
      
      for (let i = 0; i < Math.min(3, rankedPosts.length); i++) {
        const post = rankedPosts[i];
        const user = await storage.getUser(post.userId);
        if (user) {
          await storage.updateUser(post.userId, {
            trendxPoints: (user.trendxPoints || 0) + bonusPoints[i],
          });
        }
      }

      // Return rankings with updated user info
      const finalRankings = await storage.getRankedPostsForTrend(req.params.id);

      res.json({
        trend: endedTrend,
        rankings: finalRankings.map((post, index) => ({
          rank: index + 1,
          post,
          bonusPoints: index < 3 ? bonusPoints[index] : 0,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/rankings/:trendId - Get rankings for a trend
  app.get("/api/rankings/:trendId", async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.trendId);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      const rankedPosts = await storage.getRankedPostsForTrend(req.params.trendId);

      res.json({
        trendId: req.params.trendId,
        trendName: trend.name,
        isEnded: !!trend.endDate,
        rankings: rankedPosts.map((post, index) => ({
          rank: index + 1,
          post,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Posts routes

  // GET /api/posts/trend/:trendId - Get all posts for a trend with user info
  app.get("/api/posts/trend/:trendId", async (req, res) => {
    try {
      const posts = await storage.getPostsByTrend(req.params.trendId);
      
      // Include user info and vote status for each post
      const postsWithUserInfo = await Promise.all(
        posts.map(async (post) => {
          const user = await storage.getUser(post.userId);
          const userVoted = req.session.userId 
            ? !!(await storage.getVote(post.id, req.session.userId))
            : false;
          
          return {
            ...post,
            user: user ? sanitizeUser(user) : null,
            userVoted,
          };
        })
      );
      
      res.json(postsWithUserInfo);
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
      
      // Award 50 TrendX points for creating a post
      const user = await storage.getUser(req.session.userId!);
      if (user) {
        await storage.updateUser(req.session.userId!, {
          trendxPoints: (user.trendxPoints || 0) + 50,
        });
      }
      
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

      // Check if user already voted on this post
      const existingVote = await storage.getVote(result.data.postId, req.session.userId!);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted on this post" });
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

  // GET /api/comments/post/:postId - Get comments for post with user info
  app.get("/api/comments/post/:postId", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.postId);
      
      // Include user info for each comment
      const commentsWithUserInfo = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return {
            ...comment,
            user: user ? sanitizeUser(user) : null,
          };
        })
      );
      
      res.json(commentsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/comments/trend/:trendId - Get comments for trend chat with user info
  app.get("/api/comments/trend/:trendId", async (req, res) => {
    try {
      const comments = await storage.getCommentsByTrend(req.params.trendId);
      
      // Include user info for each comment
      const commentsWithUserInfo = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return {
            ...comment,
            user: user ? sanitizeUser(user) : null,
          };
        })
      );
      
      res.json(commentsWithUserInfo);
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

  // Object Storage routes

  // GET /objects/:objectPath - Serve protected objects with ACL check
  app.get("/objects/:objectPath(*)", requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // POST /api/objects/upload - Get presigned URL for upload
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // PUT /api/posts/:id/image - Update post image and set ACL
  app.put("/api/posts/:id/image", requireAuth, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const userId = req.session.userId!;

    try {
      const post = await storage.getPost(req.params.id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only update your own posts" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: userId,
          visibility: "public",
        }
      );

      const updatedPost = await storage.updatePost(req.params.id, { imageUrl: objectPath });

      res.status(200).json({
        objectPath: objectPath,
        post: updatedPost,
      });
    } catch (error) {
      console.error("Error setting post image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PUT /api/users/profile-picture - Update profile picture and set ACL
  app.put("/api/users/profile-picture", requireAuth, async (req, res) => {
    if (!req.body.profilePictureUrl) {
      return res.status(400).json({ error: "profilePictureUrl is required" });
    }

    const userId = req.session.userId!;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.profilePictureUrl,
        {
          owner: userId,
          visibility: "public",
        }
      );

      const updatedUser = await storage.updateUser(userId, { profilePicture: objectPath });

      res.status(200).json({
        objectPath: objectPath,
        user: updatedUser ? sanitizeUser(updatedUser) : null,
      });
    } catch (error) {
      console.error("Error setting profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
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
