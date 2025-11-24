import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, sanitizeUser, requireAuth, isAuthenticated } from "./auth";
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
import { R2StorageService } from "./r2Storage";
import { extractMentions } from "@/lib/mentions";
import { sendPushNotification } from "./onesignal";
import * as notificationService from "./notificationService";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (for Render and monitoring)
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Auth endpoints
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
      
      if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: "Username/email and password required" });
      }

      // Find user by username or email
      let user = await storage.getUserByUsername(usernameOrEmail);
      if (!user) {
        user = await storage.getUserByEmail(usernameOrEmail);
      }

      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid username/email or password" });
      }

      // Verify password
      const passwordValid = await comparePassword(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid username/email or password" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Session error" });
        }
        res.json({ message: "Logged in successfully", user: sanitizeUser(user) });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = newUser.id;
      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Session error" });
        }
        res.status(201).json({ message: "Account created successfully", user: sanitizeUser(newUser) });
      });

      // Send welcome push notification asynchronously (don't wait)
      notificationService.sendWelcomeNotification(newUser.id).catch((error) => {
        console.error("Failed to send welcome notification:", error);
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current authenticated user endpoint
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Trends routes

  // GET /api/trends - Get all trends (optional category query param)
  app.get("/api/trends", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const trends = await storage.getAllTrends(category);
      
      // Include creator info and calculate unique participants for each trend
      const trendsWithCreators = await Promise.all(
        trends.map(async (trend) => {
          const creator = await storage.getUser(trend.userId);
          const posts = await storage.getPostsByTrend(trend.id);
          const uniqueParticipants = new Set(posts.map(p => p.userId)).size;
          
          return {
            ...trend,
            participants: uniqueParticipants,
            creator: creator ? sanitizeUser(creator) : null,
          };
        })
      );
      
      res.json(trendsWithCreators);
    } catch (error) {
      console.error("[/api/trends] Error:", error);
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
      const posts = await storage.getPostsByTrend(trend.id);
      const uniqueParticipants = new Set(posts.map(p => p.userId)).size;
      
      res.json({ 
        ...trend, 
        participants: uniqueParticipants,
        creator: creator ? sanitizeUser(creator) : null 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/trends - Create trend (protected)
  app.post("/api/trends", isAuthenticated, async (req, res) => {
    try {
      const result = insertTrendSchema.safeParse({
        ...req.body,
        userId: (req as any).session.userId,
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }

      const trend = await storage.createTrend(result.data);
      
      // Send notification to trend creator
      await notificationService.sendTrendCreatedNotification((req as any).session.userId, result.data.name, trend.id);
      
      // Send recommendation notification to random users
      try {
        const allUsers = await storage.getAllUsers();
        const creator = await storage.getUser((req as any).session.userId);
        // Notify up to 10 random users about the new trend (excluding the creator)
        const targetUsers = allUsers
          .filter(u => u.id !== (req as any).session.userId)
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
        
        for (const targetUser of targetUsers) {
          await notificationService.sendNewTrendNotification(targetUser.id, result.data.name, trend.id).catch(err => {
            console.error("Failed to send new trend notification:", err);
          });
        }
      } catch (err) {
        console.error("Failed to send trend recommendations:", err);
      }
      
      // Create notification for followers
      const followers = await storage.getFollowers((req as any).session.userId);
      const actor = await storage.getUser((req as any).session.userId);
      for (const follow of followers) {
        await storage.createNotification({
          userId: follow.followerId,
          actorId: (req as any).session.userId,
          type: 'new_trend_from_following',
          trendId: trend.id,
        });
        // Send branded push notification for followers
        try {
          await notificationService.sendFollowedUserPostedNotification(
            follow.followerId,
            actor?.username || "Someone",
            result.data.name,
            "",
            trend.id
          );
        } catch (err) {
          console.error("Failed to send follower trend notification:", err);
        }
      }
      
      res.status(201).json(trend);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/trends/:id - Update trend (protected, only trend creator)
  app.patch("/api/trends/:id", isAuthenticated, async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.id);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      if (trend.userId !== (req as any).session.userId) {
        return res.status(403).json({ message: "Forbidden: You can only update your own trends" });
      }

      const updatedTrend = await storage.updateTrend(req.params.id, req.body);
      res.json(updatedTrend);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/trends/:id - Delete trend (protected, only trend creator)
  app.delete("/api/trends/:id", isAuthenticated, async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.id);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      if (trend.userId !== (req as any).session.userId) {
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
      
      // Include post count for each trend
      const trendsWithPostCount = await Promise.all(
        trends.map(async (trend) => {
          const posts = await storage.getPostsByTrend(trend.id);
          return {
            ...trend,
            postCount: posts.length,
          };
        })
      );
      
      res.json(trendsWithPostCount);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/dashboard/stats - Get dashboard statistics for current user (protected)
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userTrends = await storage.getTrendsByUser(userId);
      const trendsCreated = userTrends.length;
      const now = new Date();
      const activeTrends = userTrends.filter(t => !t.endDate || (t.endDate && new Date(t.endDate) > now)).length;

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

  // GET /api/dashboard/trends/:id/analytics - Get detailed analytics for a specific trend (protected, only trend creator)
  app.get("/api/dashboard/trends/:id/analytics", isAuthenticated, async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.id);
      
      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }
      
      if (trend.userId !== (req as any).session.userId) {
        return res.status(403).json({ message: "Forbidden: Only the trend creator can view analytics" });
      }

      const posts = await storage.getPostsByTrend(trend.id);
      const rankedPosts = await storage.getRankedPostsForTrend(trend.id);
      
      // Calculate unique participants
      const uniqueParticipants = new Set(posts.map(p => p.userId)).size;
      
      // Calculate total votes
      const totalVotes = posts.reduce((sum, p) => sum + (p.votes || 0), 0);
      
      // Get top posts
      const topPosts = rankedPosts.slice(0, 3).map((post, index) => ({
        rank: index + 1,
        username: post.user?.username || "Unknown",
        votes: post.votes || 0,
        imageUrl: post.imageUrl,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType || "image",
      }));
      
      // Calculate engagement rate (votes per participant)
      const engagementRate = uniqueParticipants > 0 
        ? (totalVotes / uniqueParticipants).toFixed(1) 
        : "0";
      
      // Get comments count
      const comments = await storage.getCommentsByTrend(trend.id);
      
      res.json({
        trendId: trend.id,
        trendName: trend.name,
        category: trend.category,
        views: trend.views || 0,
        participants: uniqueParticipants,
        totalPosts: posts.length,
        totalVotes,
        chatMessages: comments.length,
        engagementRate,
        topPosts,
        isActive: !trend.endDate,
        createdAt: trend.createdAt,
        endDate: trend.endDate,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/trends/:id/end - End trend and award points (protected, only trend creator)
  app.post("/api/trends/:id/end", isAuthenticated, async (req, res) => {
    try {
      const trend = await storage.getTrend(req.params.id);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      if (trend.userId !== (req as any).session.userId) {
        return res.status(403).json({ message: "Forbidden: Only the trend creator can end this trend" });
      }

      if (trend.endDate) {
        return res.status(400).json({ message: "This trend has already ended" });
      }

      // Mark trend as ended (don't set pointsAwarded yet)
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
          // Send winner notification
          await notificationService.sendWinnerNotification(post.userId, trend.name, req.params.id).catch((err) => {
            console.error("Failed to send winner notification:", err);
          });
        }
      }

      // Send non-winner notifications to all other participants
      const allPosts = await storage.getPostsByTrend(req.params.id);
      const allParticipants = new Set(allPosts.map(p => p.userId));
      const topThreeIds = new Set(rankedPosts.slice(0, 3).map(p => p.userId));
      
      for (const participantId of Array.from(allParticipants)) {
        if (!topThreeIds.has(participantId)) {
          const participant = await storage.getUser(participantId);
          if (participant?.username) {
            await notificationService.sendNonWinnerNotification(participantId, participant.username, trend.name, req.params.id).catch((err) => {
              console.error("Failed to send non-winner notification:", err);
            });
          }
        }
      }

      // Send notification to trend host that trend is wrapping up
      try {
        await notificationService.sendHostTrendEndingSoonNotification(trend.userId, trend.name, req.params.id).catch((err) => {
          console.error("Failed to send host trend ending notification:", err);
        });
      } catch (err) {
        console.error("Failed to notify trend host:", err);
      }

      // NOW mark points as awarded after distribution
      await storage.updateTrend(req.params.id, {
        pointsAwarded: 1,
      });

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

      // Check if trend has ended and points haven't been awarded yet
      const isTrendEnded = trend.endDate && new Date(trend.endDate) < new Date();
      const shouldAwardPoints = isTrendEnded && !trend.pointsAwarded;

      if (shouldAwardPoints) {
        // Get ranked posts (excluding disqualified)
        const rankedPosts = await storage.getRankedPostsForTrend(req.params.trendId);

        // Award bonus points to top 3
        const bonusPoints = [150, 100, 50];
        
        for (let i = 0; i < Math.min(3, rankedPosts.length); i++) {
          const post = rankedPosts[i];
          const user = await storage.getUser(post.userId);
          if (user) {
            await storage.updateUser(post.userId, {
              trendxPoints: (user.trendxPoints || 0) + bonusPoints[i],
            });
            
            // Create notification for bonus reward
            await storage.createNotification({
              userId: post.userId,
              type: 'bonus_reward',
              postId: post.id,
              trendId: req.params.trendId,
              pointsEarned: bonusPoints[i],
            });
            // Send push notification
            let place = "Top 3";
            if (bonusPoints[i] === 150) place = "1st place";
            else if (bonusPoints[i] === 100) place = "2nd place";
            else if (bonusPoints[i] === 50) place = "3rd place";
            await sendPushNotification({
              userId: post.userId,
              heading: "Congratulations!",
              content: `You earned ${place} - ${bonusPoints[i]} bonus points!`,
              data: { postId: post.id, trendId: req.params.trendId },
            });
          }
        }

        // Mark points as awarded
        await storage.updateTrend(req.params.trendId, {
          pointsAwarded: 1,
        });
      }

      const rankedPosts = await storage.getRankedPostsForTrend(req.params.trendId);
      const trendHost = await storage.getUser(trend.userId);

      res.json({
        trendId: req.params.trendId,
        trendName: trend.name,
        trendHostId: trend.userId,
        trendHostUsername: trendHost?.username || "Unknown",
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
          const userVoted = (req as any).session.userId 
            ? !!(await storage.getVote(post.id, (req as any).session.userId))
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

  // GET /api/posts/user/:userId - Get all posts by user
  app.get("/api/posts/user/:userId", async (req, res) => {
    try {
      const posts = await storage.getPostsByUser(req.params.userId);
      
      // Include user info for each post
      const postsWithUserInfo = await Promise.all(
        posts.map(async (post) => {
          const user = await storage.getUser(post.userId);
          return {
            ...post,
            user: user ? sanitizeUser(user) : null,
          };
        })
      );
      
      res.json(postsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/posts - Create post (protected)
  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const result = insertPostSchema.safeParse({
        ...req.body,
        userId: (req as any).session.userId,
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }

      const post = await storage.createPost(result.data);
      
      // Increment trend participants count (total posts)
      await storage.incrementTrendParticipants(result.data.trendId);
      
      // Send notification to post creator
      const trend = await storage.getTrend(result.data.trendId);
      if (trend) {
        await notificationService.sendPostCreatedNotification((req as any).session.userId, trend.name, trend.id, post.id).catch((err) => {
          console.error("Failed to send post created notification:", err);
        });
      }
      
      // Send notification to followers when they post
      try {
        const followers = await storage.getFollowers((req as any).session.userId);
        const postAuthor = await storage.getUser((req as any).session.userId);
        if (postAuthor && trend) {
          for (const follow of followers) {
            // Create notification in database
            await storage.createNotification({
              userId: follow.followerId,
              actorId: (req as any).session.userId,
              type: 'new_post_from_following',
              postId: post.id,
              trendId: result.data.trendId,
            });
            // Send branded push notification
            try {
              await notificationService.sendFollowedUserPostedNotification(
                follow.followerId,
                postAuthor.username,
                trend.name,
                post.id,
                trend.id
              );
            } catch (err) {
              console.error("Failed to send followed user posted notification:", err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to process follower notifications:", err);
      }
      
      // Notify trend host of new post
      try {
        const trend = await storage.getTrend(result.data.trendId);
        if (trend && trend.userId !== (req as any).session.userId) {
          // Create notification in database
          await storage.createNotification({
            userId: trend.userId,
            actorId: (req as any).session.userId,
            type: 'post_in_your_trend',
            postId: post.id,
            trendId: result.data.trendId,
          });
          // Send branded push notification
          try {
            await notificationService.sendHostNewPostNotification(
              trend.userId,
              trend.name,
              post.id,
              trend.id
            );
          } catch (err) {
            console.error("Failed to send host new post notification:", err);
          }
        }
      } catch (err) {
        console.error("Failed to process host notifications:", err);
      }
      
      // Award 50 TrendX points for creating a post
      try {
        const user = await storage.getUser((req as any).session.userId);
        if (user) {
          await storage.updateUser((req as any).session.userId, {
            trendxPoints: (user.trendxPoints || 0) + 50,
          });
          
          // Create notification for earning points
          await storage.createNotification({
            userId: (req as any).session.userId,
            type: 'earned_points',
            postId: post.id,
            trendId: result.data.trendId,
            pointsEarned: 50,
          });
          // Send push notification
          try {
            await sendPushNotification({
              userId: (req as any).session.userId,
              heading: "Points Earned",
              content: "You earned 50 TrendX points for posting!",
              data: { postId: post.id, trendId: result.data.trendId },
            });
          } catch (err) {
            console.error("Failed to send points push notification:", err);
          }
        }
      } catch (err) {
        console.error("Failed to process points notifications:", err);
      }

      // Check for streak notification - user posted in 3+ different trends this week
      try {
        const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
        const userPosts = await storage.getPostsByUser((req as any).session.userId);
        
        // Filter posts from last 7 days
        const recentPosts = userPosts.filter(p => {
          const postDate = p.createdAt instanceof Date ? p.createdAt : (p.createdAt ? new Date(p.createdAt) : new Date());
          return postDate >= sevenDaysAgo;
        });
        
        // Count unique trends
        const uniqueTrends = new Set(recentPosts.map(p => p.trendId));
        
        if (uniqueTrends.size >= 3) {
          await notificationService.sendStreakNotification(
            (req as any).session.userId,
            uniqueTrends.size
          ).catch((err) => {
            console.error("Failed to send streak notification:", err);
          });
        }
      } catch (err) {
        console.error("Failed to check for streak notification:", err);
      }
      
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/posts/:id/disqualify - Toggle disqualify status (protected, only trend creator)
  app.patch("/api/posts/:id/disqualify", isAuthenticated, async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const trend = await storage.getTrend(post.trendId);

      if (!trend) {
        return res.status(404).json({ message: "Trend not found" });
      }

      if (trend.userId !== (req as any).session.userId) {
        return res.status(403).json({ message: "Forbidden: Only the trend creator can disqualify posts" });
      }

      // Toggle disqualification status
      const newStatus = post.isDisqualified ? 0 : 1;
      const updatedPost = await storage.updatePost(req.params.id, { isDisqualified: newStatus });
      
      // Remove or restore 50 TrendX points based on disqualification status
      const postOwner = await storage.getUser(post.userId);
      if (postOwner) {
        if (newStatus === 1) {
          // Disqualifying - remove 50 points
          await storage.updateUser(post.userId, {
            trendxPoints: Math.max(0, (postOwner.trendxPoints || 0) - 50),
          });
        } else {
          // Requalifying - restore 50 points
          await storage.updateUser(post.userId, {
            trendxPoints: (postOwner.trendxPoints || 0) + 50,
          });
        }
      }
      
      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Votes routes

  // POST /api/votes/increment - Increment vote on post (protected, check 10-vote limit per trend)
  app.post("/api/votes/increment", isAuthenticated, async (req, res) => {
    try {
      const { postId, trendId } = req.body;

      if (!postId || !trendId) {
        return res.status(400).json({ message: "postId and trendId are required" });
      }

      // Check 10-vote limit per trend (sum of all vote counts)
      const userVotes = await storage.getVotesByUser((req as any).session.userId, trendId);
      const totalVotes = userVotes.reduce((sum, vote) => sum + (vote.count || 0), 0);
      
      if (totalVotes >= 10) {
        return res.status(400).json({ message: "You have reached the maximum of 10 votes for this trend" });
      }

      // Get all posts in trend BEFORE vote
      const postsBeforeVote = await storage.getPostsByTrend(trendId);
      const rankedBefore = [...postsBeforeVote].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const rankBefore = rankedBefore.findIndex(p => p.id === postId) + 1;

      const vote = await storage.incrementVote(postId, (req as any).session.userId, trendId);
      
      // Get all posts in trend AFTER vote
      const postsAfterVote = await storage.getPostsByTrend(trendId);
      const rankedAfter = [...postsAfterVote].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const rankAfter = rankedAfter.findIndex(p => p.id === postId) + 1;

      // Get the post and trend info for notifications
      const post = await storage.getPost(postId);
      const trend = await storage.getTrend(trendId);
      const voter = await storage.getUser((req as any).session.userId);
      
      // Create notification for vote on post
      if (post && post.userId !== (req as any).session.userId) {
        await storage.createNotification({
          userId: post.userId,
          actorId: (req as any).session.userId,
          type: 'vote_on_post',
          postId: postId,
          trendId: trendId,
          voteCount: vote.count,
        });
        // Send push notification
        await sendPushNotification({
          userId: post.userId,
          heading: "Vote Received",
          content: `${voter?.username} voted ${vote.count}x on your post`,
          data: { postId, trendId },
        });
      }
      
      // Send rank change notifications if rank improved
      if (post && rankAfter < rankBefore && trend) {
        await notificationService.sendRankGainedNotification(post.userId, trend.name || "Unknown Trend", trendId);
      }
      
      // Check if other posts' ranks got worse (someone else's post dropped in rank due to this vote)
      for (let i = 0; i < Math.min(rankedBefore.length, rankedAfter.length); i++) {
        const postBefore = rankedBefore[i];
        const postAfter = rankedAfter.find(p => p.id === postBefore.id);
        if (postAfter) {
          const oldRank = i + 1;
          const newRank = rankedAfter.findIndex(p => p.id === postBefore.id) + 1;
          
          // If rank got worse and it's not the post we just voted on
          if (newRank > oldRank && postBefore.id !== postId && trend) {
            await notificationService.sendRankLostNotification(postBefore.userId, trend.name || "Unknown Trend", trendId);
          }
        }
      }

      // Notify users if trend is "blowing up" (high engagement)
      try {
        if (trend && trend.name) {
          const totalVotes = postsAfterVote.reduce((sum, p) => sum + (p.votes || 0), 0);
          // If total votes > 50 and post count > 3, notify about trend momentum
          if (totalVotes > 50 && postsAfterVote.length > 3) {
            const allUsers = await storage.getAllUsers?.() || [];
            const randomUsers = allUsers
              .filter(u => u.id !== post?.userId)
              .sort(() => Math.random() - 0.5)
              .slice(0, 5);
            
            for (const user of randomUsers) {
              await notificationService.sendTrendBlowingUpNotification(user.id, trend.name, trendId).catch(err => {
                console.error("Failed to send trend blowing up notification:", err);
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to check trend momentum:", err);
      }
      
      res.status(201).json(vote);
    } catch (error) {
      console.error("Vote increment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/votes/decrement - Decrement vote on post (protected)
  app.post("/api/votes/decrement", isAuthenticated, async (req, res) => {
    try {
      const { postId, trendId } = req.body;

      if (!postId) {
        return res.status(400).json({ message: "postId is required" });
      }

      // Get the post to find trendId if not provided
      const post = await storage.getPost(postId);
      const actualTrendId = trendId || (post?.trendId as string);

      if (!actualTrendId) {
        return res.status(400).json({ message: "Unable to determine trend" });
      }

      // Get all posts in trend BEFORE vote removal
      const postsBeforeVote = await storage.getPostsByTrend(actualTrendId);
      const rankedBefore = [...postsBeforeVote].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const rankBefore = rankedBefore.findIndex(p => p.id === postId) + 1;

      const vote = await storage.decrementVote(postId, (req as any).session.userId);
      
      // Get all posts in trend AFTER vote removal
      const postsAfterVote = await storage.getPostsByTrend(actualTrendId);
      const rankedAfter = [...postsAfterVote].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const rankAfter = rankedAfter.findIndex(p => p.id === postId) + 1;

      // Get trend info for notifications
      const trend = await storage.getTrend(actualTrendId);

      // Send rank change notifications if rank worsened
      if (post && rankAfter > rankBefore && trend && vote !== null) {
        await notificationService.sendRankLostNotification(post.userId, trend.name || "Unknown Trend", actualTrendId);
      }

      // Check if other posts' ranks improved (someone else's post improved due to this vote removal)
      for (let i = 0; i < Math.min(rankedBefore.length, rankedAfter.length); i++) {
        const postBefore = rankedBefore[i];
        const postAfter = rankedAfter.find(p => p.id === postBefore.id);
        if (postAfter) {
          const oldRank = i + 1;
          const newRank = rankedAfter.findIndex(p => p.id === postBefore.id) + 1;
          
          // If rank improved and it's not the post we just removed the vote from
          if (newRank < oldRank && postBefore.id !== postId && trend) {
            await notificationService.sendRankGainedNotification(postBefore.userId, trend.name || "Unknown Trend", actualTrendId);
          }
        }
      }

      if (vote === null) {
        return res.json({ message: "Vote removed or decreased to zero" });
      }

      res.json(vote);
    } catch (error) {
      console.error("Vote decrement error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/votes/trend/:trendId/count - Get user's vote count for trend (protected)
  app.get("/api/votes/trend/:trendId/count", isAuthenticated, async (req, res) => {
    try {
      const votes = await storage.getVotesByUser((req as any).session.userId, req.params.trendId);
      const totalVotes = votes.reduce((sum, vote) => sum + (vote.count || 0), 0);
      res.json({ count: totalVotes });
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
  app.post("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const result = insertCommentSchema.safeParse({
        ...req.body,
        userId: (req as any).session.userId,
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }

      const comment = await storage.createComment(result.data);
      
      // Create notification for comment on post or reply to comment
      const commenter = await storage.getUser((req as any).session.userId);
      if (comment.postId) {
        // Comment on a post - notify post owner
        const post = await storage.getPost(comment.postId);
        if (post && post.userId !== (req as any).session.userId) {
          await storage.createNotification({
            userId: post.userId,
            actorId: (req as any).session.userId,
            type: 'comment_on_post',
            postId: comment.postId,
            trendId: comment.trendId,
            commentId: comment.id,
          });
          // Send push notification
          if (commenter?.username) {
            await sendPushNotification({
              userId: post.userId,
              heading: "New Comment",
              content: `${commenter.username} commented on your post`,
              data: { postId: String(comment.postId), trendId: String(comment.trendId) },
            });
          }
        }
      }
      
      // Send notification if this is a reply to another comment
      if (comment.parentId) {
        const parentComment = await storage.getComment(comment.parentId);
        if (parentComment && parentComment.userId !== (req as any).session.userId) {
          // Create notification in database
          await storage.createNotification({
            userId: parentComment.userId,
            actorId: (req as any).session.userId,
            type: 'reply_to_comment',
            commentId: comment.id,
            postId: comment.postId,
            trendId: comment.trendId,
          });
          // Send branded push notification
          if (commenter?.username && comment.trendId) {
            try {
              const trendForReply = await storage.getTrend(comment.trendId);
              if (trendForReply) {
                await notificationService.sendReplyNotification(
                  parentComment.userId,
                  commenter.username,
                  trendForReply.name,
                  comment.trendId
                );
              }
            } catch (err) {
              console.error("Failed to send reply notification:", err);
            }
          }
        }
      }
      
      // Handle @mentions in comment
      const mentions = extractMentions(comment.text);
      if (mentions.length > 0) {
        for (const username of mentions) {
          const mentionedUser = await storage.getUserByUsername(username);
          if (mentionedUser && mentionedUser.id !== (req as any).session.userId) {
            // Create notification in database
            await storage.createNotification({
              userId: mentionedUser.id,
              actorId: (req as any).session.userId,
              type: 'mention',
              commentId: comment.id,
              postId: comment.postId,
              trendId: comment.trendId,
            });
            // Send branded push notification
            if (commenter?.username && comment.trendId) {
              try {
                const trendForMention = await storage.getTrend(comment.trendId);
                if (trendForMention) {
                  await notificationService.sendMentionNotification(
                    mentionedUser.id,
                    commenter.username,
                    trendForMention.name,
                    comment.trendId
                  );
                }
              } catch (err) {
                console.error("Failed to send mention notification:", err);
              }
            }
          }
        }
      }
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/comments/:id - Delete comment (protected, only comment owner)
  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const comment = await storage.getComment(req.params.id);

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.userId !== (req as any).session.userId) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own comments" });
      }

      await storage.deleteComment(req.params.id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Follows routes

  // POST /api/follows - Follow user (protected)
  app.post("/api/follows", isAuthenticated, async (req, res) => {
    try {
      const result = insertFollowSchema.safeParse({
        followerId: (req as any).session.userId,
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
      const follower = await storage.getUser((req as any).session.userId);
      
      // Create notification for new follower
      await storage.createNotification({
        userId: result.data.followingId,
        actorId: (req as any).session.userId,
        type: 'new_follower',
      });
      // Send push notification using notification service
      if (follower?.username) {
        await notificationService.sendNewFollowerNotification(result.data.followingId, follower.username, (req as any).session.userId).catch((err) => {
          console.error("Failed to send new follower notification:", err);
        });
      }
      
      res.status(201).json(follow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/follows/:userId - Unfollow user (protected)
  app.delete("/api/follows/:userId", isAuthenticated, async (req, res) => {
    try {
      const follow = await storage.getFollow((req as any).session.userId, req.params.userId);

      if (!follow) {
        return res.status(404).json({ message: "Follow relationship not found" });
      }

      await storage.deleteFollow((req as any).session.userId, req.params.userId);
      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/follows/:userId/status - Check if current user follows another user (protected)
  app.get("/api/follows/:userId/status", isAuthenticated, async (req, res) => {
    try {
      const follow = await storage.getFollow((req as any).session.userId, req.params.userId);
      res.json({ isFollowing: !!follow });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Object Storage routes

  // GET /objects/:objectPath - Serve protected objects with ACL check
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = (req as any).session.userId;
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

  // POST /api/objects/upload - Get presigned URL for upload (R2)
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const { folder, fileExtension } = req.body;
      const r2Service = new R2StorageService();
      const { uploadURL, publicURL } = await r2Service.getObjectEntityUploadURL(
        folder || 'uploads',
        fileExtension || ''
      );
      console.log("Generated upload URL:", uploadURL);
      console.log("Generated public URL:", publicURL);
      res.json({ uploadURL, publicURL });
    } catch (error) {
      console.error("Error generating R2 upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // POST /api/object-storage/upload-url - Get presigned URL for custom path upload (R2)
  app.post("/api/object-storage/upload-url", isAuthenticated, async (req, res) => {
    try {
      const { path } = req.body;
      
      if (!path) {
        return res.status(400).json({ error: "path is required" });
      }

      const r2Service = new R2StorageService();
      const { uploadURL, publicURL } = await r2Service.getCustomUploadURL(path);
      res.json({ uploadUrl: uploadURL, publicUrl: publicURL });
    } catch (error) {
      console.error("Error generating R2 upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // PUT /api/posts/:id/image - Update post image and set ACL
  app.put("/api/posts/:id/image", isAuthenticated, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const userId = (req as any).session.userId;

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
  app.put("/api/users/profile-picture", isAuthenticated, async (req, res) => {
    if (!req.body.profilePictureUrl) {
      return res.status(400).json({ error: "profilePictureUrl is required" });
    }

    const userId = (req as any).session.userId;

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

  // POST /api/auth/change-password - Change password (protected)
  app.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const user = await storage.getUser((req as any).session.userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found or no password set" });
      }

      const passwordMatch = await comparePassword(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser((req as any).session.userId, {
        password: hashedPassword,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Password changed successfully" });
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
  app.patch("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const { email, fullName, bio, profilePicture, instagramUrl, tiktokUrl, twitterUrl, youtubeUrl, categories, role } = req.body;

      const updatedUser = await storage.updateUser((req as any).session.userId, {
        email,
        fullName,
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

  // View Tracking routes

  // POST /api/view-tracking - Update view tracking (protected)
  app.post("/api/view-tracking", isAuthenticated, async (req, res) => {
    try {
      const { type, identifier } = req.body;

      if (!type || !identifier) {
        return res.status(400).json({ message: "type and identifier are required" });
      }

      const tracking = await storage.updateViewTracking((req as any).session.userId, type, identifier);
      res.json(tracking);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/trends/:id/view - Track trend view (protected)
  app.post("/api/trends/:id/view", isAuthenticated, async (req, res) => {
    try {
      await storage.trackTrendView((req as any).session.userId, req.params.id);
      res.json({ message: "View tracked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/notifications/counts - Get new content counts (protected)
  app.get("/api/notifications/counts", isAuthenticated, async (req, res) => {
    try {
      const counts = await storage.getNewContentCounts((req as any).session.userId);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Saved Items routes

  // POST /api/saved/trends/:trendId - Save a trend (protected)
  app.post("/api/saved/trends/:trendId", isAuthenticated, async (req, res) => {
    try {
      const isSaved = await storage.isTrendSaved((req as any).session.userId, req.params.trendId);
      if (isSaved) {
        return res.status(400).json({ message: "Trend already saved" });
      }
      const saved = await storage.saveTrend((req as any).session.userId, req.params.trendId);
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/saved/trends/:trendId - Unsave a trend (protected)
  app.delete("/api/saved/trends/:trendId", isAuthenticated, async (req, res) => {
    try {
      await storage.unsaveTrend((req as any).session.userId, req.params.trendId);
      res.json({ message: "Trend unsaved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/saved/trends/:trendId/status - Check if trend is saved (protected)
  app.get("/api/saved/trends/:trendId/status", isAuthenticated, async (req, res) => {
    try {
      const isSaved = await storage.isTrendSaved((req as any).session.userId, req.params.trendId);
      res.json({ isSaved });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/saved/trends - Get user's saved trends (protected)
  app.get("/api/saved/trends", isAuthenticated, async (req, res) => {
    try {
      const trends = await storage.getSavedTrends((req as any).session.userId);
      
      // Include creator info and calculate unique participants for each trend
      const trendsWithCreators = await Promise.all(
        trends.map(async (trend) => {
          const creator = await storage.getUser(trend.userId);
          const posts = await storage.getPostsByTrend(trend.id);
          const uniqueParticipants = new Set(posts.map(p => p.userId)).size;
          
          return {
            ...trend,
            participants: uniqueParticipants,
            creator: creator ? sanitizeUser(creator) : null,
          };
        })
      );
      
      res.json(trendsWithCreators);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/saved/posts/:postId - Save a post (protected)
  app.post("/api/saved/posts/:postId", isAuthenticated, async (req, res) => {
    try {
      const isSaved = await storage.isPostSaved((req as any).session.userId, req.params.postId);
      if (isSaved) {
        return res.status(400).json({ message: "Post already saved" });
      }
      const saved = await storage.savePost((req as any).session.userId, req.params.postId);
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/saved/posts/:postId - Unsave a post (protected)
  app.delete("/api/saved/posts/:postId", isAuthenticated, async (req, res) => {
    try {
      await storage.unsavePost((req as any).session.userId, req.params.postId);
      res.json({ message: "Post unsaved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/saved/posts/:postId/status - Check if post is saved (protected)
  app.get("/api/saved/posts/:postId/status", isAuthenticated, async (req, res) => {
    try {
      const isSaved = await storage.isPostSaved((req as any).session.userId, req.params.postId);
      res.json({ isSaved });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/saved/posts - Get user's saved posts (protected)
  app.get("/api/saved/posts", isAuthenticated, async (req, res) => {
    try {
      const posts = await storage.getSavedPosts((req as any).session.userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/posts/:id - Delete post (protected, only post owner)
  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.userId !== (req as any).session.userId) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own posts" });
      }
      
      // Decrement trend participants count (total posts)
      try {
        await storage.decrementTrendParticipants(post.trendId);
      } catch (e) {
        console.error("Failed to decrement trend participants:", e);
      }
      
      // Remove 50 TrendX points only if the post was not already disqualified
      if (!post.isDisqualified) {
        try {
          const user = await storage.getUser(post.userId);
          if (user) {
            await storage.updateUser(post.userId, {
              trendxPoints: Math.max(0, (user.trendxPoints || 0) - 50),
            });
          }
        } catch (e) {
          console.error("Failed to update user points:", e);
        }
      }
      
      await storage.deletePost(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/notifications - Get user's notifications (protected)
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getNotifications((req as any).session.userId, limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/notifications/unread-count - Get unread notification count (protected)
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadCount((req as any).session.userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/notifications/:id/read - Mark notification as read (protected)
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      await storage.markAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/notifications/mark-all-read - Mark all notifications as read (protected)
  app.patch("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      await storage.markAllAsRead((req as any).session.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/notifications/:id - Delete notification (protected)
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/push/subscribe - Save OneSignal subscription (protected)
  app.post("/api/push/subscribe", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📥 POST /api/push/subscribe called");
      console.log(`   👤 User ID: ${userId}`);
      console.log(`   📦 Body:`, req.body);
      
      const { subscriptionId, oneSignalUserId, pushToken } = req.body;

      if (!subscriptionId || subscriptionId === 'pending') {
        console.log(`   ❌ Invalid subscriptionId: "${subscriptionId}"`);
        return res.status(400).json({ message: "subscriptionId is missing or not ready - please try again" });
      }

      console.log(`   ✅ Saving subscription to database...`);
      const subscription = await storage.saveOneSignalSubscription({
        userId,
        subscriptionId,
        oneSignalUserId: oneSignalUserId || undefined,
        externalId: userId,
        pushToken: pushToken || undefined,
        isActive: 1,
      });

      console.log(`✅ OneSignal subscription saved!`);
      console.log(`   📱 Subscription ID: ${subscriptionId}`);
      console.log(`   🆔 OneSignal User ID: ${oneSignalUserId || 'pending'}`);
      console.log(`   🔑 Push Token: ${pushToken ? '✓ present' : '✗ not provided'}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      res.json({ 
        message: "Subscription saved successfully", 
        subscription,
        ids: {
          userId,
          subscriptionId,
          oneSignalUserId: oneSignalUserId || 'not assigned yet',
          externalId: userId,
        }
      });
    } catch (error) {
      console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ Error saving subscription:", error);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      res.status(500).json({ message: "Failed to save subscription", error: String(error) });
    }
  });

  // GET /api/push/subscription - Get user's OneSignal subscription (protected)
  app.get("/api/push/subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const subscription = await storage.getOneSignalSubscription(userId);
      
      if (!subscription) {
        return res.json({ 
          subscription: null, 
          message: "No active subscription",
          ids: {
            userId,
            subscriptionId: null,
            oneSignalUserId: null,
          }
        });
      }

      res.json({ 
        subscription,
        ids: {
          userId: subscription.userId,
          subscriptionId: subscription.subscriptionId,
          oneSignalUserId: subscription.oneSignalUserId,
          externalId: subscription.externalId,
        }
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // GET /api/push/status - Check if user has active push notifications (protected)
  app.get("/api/push/status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const subscription = await storage.getOneSignalSubscription(userId);
      
      res.json({ 
        isEnabled: !!subscription && subscription.isActive === 1,
        subscription: subscription ? {
          subscriptionId: subscription.subscriptionId,
          oneSignalUserId: subscription.oneSignalUserId,
          lastUpdated: subscription.createdAt,
        } : null
      });
    } catch (error) {
      console.error("Error checking push status:", error);
      res.status(500).json({ message: "Failed to check push status" });
    }
  });

  // POST /api/notifications/test - Send test notification (protected, for debugging)
  app.post("/api/notifications/test", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log("❌ Test notification failed: User not found");
        return res.status(404).json({ message: "User not found" });
      }

      console.log("\n🧪 TEST NOTIFICATION ENDPOINT CALLED");
      console.log(`   👤 User: ${user.username} (ID: ${userId})`);
      console.log(`   ⏰ Time: ${new Date().toISOString()}`);

      // Send test push notification
      console.log("   📤 Attempting to send test push notification...");
      await sendPushNotification({
        userId,
        heading: "Test Notification 🧪",
        content: `Hey ${user.username}! This is a test. If you see this, OneSignal is working! 🔥`,
        data: { type: "test" },
      });

      console.log(`✅ Test notification sent successfully!`);
      res.json({ 
        message: "Test notification sent!", 
        userId,
        username: user.username,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("\n❌ Error sending test notification:");
      console.error(error);
      res.status(500).json({ message: "Failed to send test notification", error: String(error) });
    }
  });

  // POST /api/notifications/debug - Debug notification (for testing)
  app.post("/api/notifications/debug", async (req, res) => {
    try {
      // Try to use logged-in user, fall back to test user if not authenticated
      const userId = (req as any).session?.userId || "fe48a989-b30c-41f7-a4a0-f4f1fedf38a6";
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log("❌ Debug test failed: User not found");
        return res.status(404).json({ message: "Test user not found" });
      }

      console.log("\n🎯🎯🎯 DEBUG NOTIFICATION TEST STARTED 🎯🎯🎯");
      console.log(`   👤 Test User: ${user.username} (ID: ${userId})`);
      console.log(`   ⏰ Time: ${new Date().toISOString()}`);
      console.log(`   🔐 Checking OneSignal credentials...`);
      console.log(`   APP_ID: ${process.env.ONESIGNAL_APP_ID ? '✓ SET' : '✗ MISSING'}`);
      console.log(`   REST_API_KEY: ${process.env.ONESIGNAL_REST_API_KEY ? '✓ SET' : '✗ MISSING'}`);

      console.log(`\n   📤 Attempting to send test push notification...\n`);
      await sendPushNotification({
        userId,
        heading: "🎯 Debug Test Notification",
        content: `Debug test for ${user.username}. If you see this, the system works! 🔥`,
        data: { type: "debug_test" },
      });

      console.log(`\n✅ Debug test completed!`);
      res.json({ 
        message: "Debug test completed - check server logs and check for push notification!", 
        userId,
        username: user.username,
        loggedIn: !!(req as any).session?.userId
      });
    } catch (error) {
      console.error("\n❌ Debug test failed:");
      console.error(error);
      res.status(500).json({ message: "Debug test failed", error: String(error) });
    }
  });

  // POST /api/notifications/scheduled/trend-ending-soon - Send trend ending soon notifications (can be called by cron)
  app.post("/api/notifications/scheduled/trend-ending-soon", async (req, res) => {
    try {
      // Get all active trends that end within next 24 hours
      const trends = await storage.getAllTrends();
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      let notificationsSent = 0;
      for (const trend of trends) {
        if (trend.endDate) {
          const endDate = new Date(trend.endDate);
          // If trend ends between now and tomorrow and hasn't ended yet
          if (endDate > now && endDate <= tomorrow) {
            // Get participants
            const posts = await storage.getPostsByTrend(trend.id);
            const participants = new Set(posts.map(p => p.userId));
            
            // Send notification to each participant
            for (const participantId of Array.from(participants)) {
              const timeLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
              try {
                await notificationService.sendTrendEndingSoonNotification(
                  participantId,
                  trend.name,
                  `${timeLeft} hour${timeLeft !== 1 ? 's' : ''}`,
                  trend.id
                ).catch(err => {
                  console.error("Failed to send trend ending soon notification:", err);
                });
                notificationsSent++;
              } catch (err) {
                console.error("Error notifying participant:", err);
              }
            }
          }
        }
      }
      
      res.json({ 
        message: "Trend ending soon notifications sent",
        count: notificationsSent 
      });
    } catch (error) {
      console.error("Error sending trend ending notifications:", error);
      res.status(500).json({ message: "Failed to send trend ending notifications" });
    }
  });

  // POST /api/notifications/scheduled/inactive-users - Send re-engagement notifications (can be called by cron)
  app.post("/api/notifications/scheduled/inactive-users", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers?.() || [];
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      let notificationsSent = 0;
      for (const user of allUsers) {
        // Check if user hasn't logged in for 30 days
        // For now, send to all users since lastLogin tracking isn't implemented
        // In production, this would check user.lastLogin field
        if (!user.id) continue;
        try {
          await notificationService.sendInactiveUserWakeUpNotification(user.id, user.username).catch(err => {
            console.error("Failed to send inactive user notification:", err);
          });
          notificationsSent++;
        } catch (err) {
          console.error("Error notifying inactive user:", err);
        }
      }
      
      res.json({ 
        message: "Inactive user wake-up notifications sent",
        count: notificationsSent 
      });
    } catch (error) {
      console.error("Error sending inactive user notifications:", error);
      res.status(500).json({ message: "Failed to send inactive user notifications" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
