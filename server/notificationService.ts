import { storage } from "./storage";
import { sendPushNotification } from "./onesignal";
import * as schema from "@shared/schema";

// Variant rotation system for notifications
const RANK_GAINED_VARIANTS = [
  { title: "You're Climbing! 🔥", content: "Your post just jumped up the rankings. Keep applying pressure. 😤🔥" },
  { title: "You Just Passed Someone 👀🔥", content: "Nice move — you overtook another post. Stay hot. 💪🔥" },
  { title: "They're Slipping… You're Not 😭🔥", content: "Your post climbed again. Someone's losing their spot — not you. 🔥" },
];

const RANK_LOST_VARIANTS = [
  { title: "They Just Passed You 😭🔥", content: "Someone snatched your spot. You gonna let that slide?" },
  { title: "Someone Just Passed You… AGAIN 😒🔥", content: "You dropped. They're climbing — you're not. Fix that ASAP." },
  { title: "You Got Overtaken 👀🔥", content: "Another post just jumped ahead of you. Fight back while you still can. 😤🔥" },
];

const getNextVariant = (lastVariant: number, totalVariants: number): number => {
  return (lastVariant + 1) % totalVariants;
};

export async function sendWelcomeNotification(userId: string) {
  const user = await storage.getUser(userId);
  if (!user?.username) return;

  await sendPushNotification({
    userId,
    heading: "Welcome to Trendx 🔥👋",
    content: `You're in, ${user.username}. Jump into a trend and make your mark. The spotlight's waiting. 😤🔥`,
    data: { type: "welcome" },
  });
}

export async function sendHostNewPostNotification(hostId: string, trendName: string, postId: string, trendId: string) {
  const canSend = await checkRateLimit(hostId, "host_new_post", 8); // 8 per day max for host posts
  if (!canSend) return;

  await sendPushNotification({
    userId: hostId,
    heading: "New Post Just Dropped in Your Trend 👀🔥",
    content: `Someone just posted in ${trendName}. Your trend is heating up — check it out.`,
    data: { type: "host_new_post", postId, trendId },
  });
  
  await recordNotificationSent(hostId, "host_new_post");
}

export async function sendNewPostNotification(userId: string, trendName: string, postId: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "new_post", 8);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "A Fresh Post Just Landed 🔥",
    content: `A new post was added in ${trendName}. Jump in before you fall behind.`,
    data: { type: "new_post", postId, trendId },
  });

  await recordNotificationSent(userId, "new_post");
}

export async function sendTrendEndingSoonNotification(userId: string, trendName: string, timeLeft: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "trend_ending_soon", 1);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "Final Hours. No More Excuses 😤🔥",
    content: `Yo {{username}}, ${trendName} ends in ${timeLeft}. Someone is catching up fast — push now or lose your spot.`,
    data: { type: "trend_ending_soon", trendId },
  });

  await recordNotificationSent(userId, "trend_ending_soon");
}

export async function sendRankGainedNotification(userId: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "rank_gained", 5);
  if (!canSend) return;

  const tracking = await getNotificationTracking(userId, "rank_gained");
  const variantIndex = getNextVariant(tracking?.lastVariant || 0, RANK_GAINED_VARIANTS.length);
  const variant = RANK_GAINED_VARIANTS[variantIndex];

  await sendPushNotification({
    userId,
    heading: variant.title,
    content: `${variant.content} in ${trendName}`,
    data: { type: "rank_gained", trendId, variant: String(variantIndex) },
  });

  await recordNotificationSent(userId, "rank_gained", variantIndex);
}

export async function sendRankLostNotification(userId: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "rank_lost", 5);
  if (!canSend) return;

  const tracking = await getNotificationTracking(userId, "rank_lost");
  const variantIndex = getNextVariant(tracking?.lastVariant || 0, RANK_LOST_VARIANTS.length);
  const variant = RANK_LOST_VARIANTS[variantIndex];

  await sendPushNotification({
    userId,
    heading: variant.title,
    content: `${variant.content} in ${trendName}`,
    data: { type: "rank_lost", trendId, variant: String(variantIndex) },
  });

  await recordNotificationSent(userId, "rank_lost", variantIndex);
}

export async function sendHostTrendEndingSoonNotification(hostId: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(hostId, "host_trend_ending_soon", 1);
  if (!canSend) return;

  await sendPushNotification({
    userId: hostId,
    heading: "Your Trend Is Wrapping Up Soon ⏳🔥",
    content: `${trendName} is almost over. Check the final rankings and get ready to crown your winners.`,
    data: { type: "host_trend_ending_soon", trendId },
  });

  await recordNotificationSent(hostId, "host_trend_ending_soon");
}

export async function sendNonWinnerNotification(userId: string, username: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "non_winner", 15);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "You Didn't Win… But You Weren't Far 😭🔥",
    content: `No crown this time, ${username}, but you were close. Jump into the next trend — redemption arc loading.`,
    data: { type: "non_winner", trendId },
  });

  await recordNotificationSent(userId, "non_winner");
}

export async function sendWinnerNotification(userId: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "winner", 15);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "You Dominated the Trend 🏆🔥",
    content: `You didn't just compete — you crushed everyone in ${trendName}. Congrats, you earned it. 💪🔥`,
    data: { type: "winner", trendId },
  });

  await recordNotificationSent(userId, "winner");
}

export async function sendNewTrendNotification(userId: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "new_trend_recommendation", 3);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "A New Trend Just Dropped 👀🔥",
    content: `${trendName} is live. Get in early and secure an easy top rank.`,
    data: { type: "new_trend", trendId },
  });

  await recordNotificationSent(userId, "new_trend_recommendation");
}

export async function sendTrendBlowingUpNotification(userId: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "trend_blowing_up", 3);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "This Trend Is Cooking HARD 🔥👀",
    content: `${trendName} is blowing up right now. If you sleep, you miss the wave.`,
    data: { type: "trend_blowing_up", trendId },
  });

  await recordNotificationSent(userId, "trend_blowing_up");
}

export async function sendPostCreatedNotification(userId: string, trendName: string, trendId: string, postId: string) {
  const canSend = await checkRateLimit(userId, "post_created", 10);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "Your Post Is Live 🔥",
    content: `You just entered ${trendName} — now go get those votes. 😤🔥`,
    data: { type: "post_created", postId, trendId },
  });

  await recordNotificationSent(userId, "post_created");
}

export async function sendTrendCreatedNotification(userId: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "trend_created", 10);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "Your Trend Is Live 🔥",
    content: `Your challenge ${trendName} is up — share it and let the battle begin. 😤🔥`,
    data: { type: "trend_created", trendId },
  });

  await recordNotificationSent(userId, "trend_created");
}

export async function sendNewFollowerNotification(userId: string, followerUsername: string, followerId: string) {
  const canSend = await checkRateLimit(userId, "new_follower", 10);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "New Follower 👀🔥",
    content: `${followerUsername} just followed you. You're on their radar now — keep the heat coming. 🔥`,
    data: { type: "new_follower", userId: followerId },
  });

  await recordNotificationSent(userId, "new_follower");
}

export async function sendFollowedUserPostedNotification(userId: string, actorUsername: string, trendName: string, postId: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "followed_user_posted", 10);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "📸✨ Someone You Follow Just Posted!",
    content: `${actorUsername} just dropped a new post in ${trendName} 👀🔥\nSlide in before they start farming all the clout.`,
    data: { type: "followed_user_posted", postId, trendId },
  });

  await recordNotificationSent(userId, "followed_user_posted");
}

export async function sendInactiveUserWakeUpNotification(userId: string, username: string) {
  const canSend = await checkRateLimit(userId, "inactive_user_wakeup", 1);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "⚡😤 Trendx Lowkey Missed You…",
    content: `It's been a minute, ${username} 😭🔥\nTrendx have been going crazy without you — come back.`,
    data: { type: "inactive_user_wakeup" },
  });

  await recordNotificationSent(userId, "inactive_user_wakeup");
}

export async function sendMentionNotification(userId: string, actorUsername: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "mention", 10);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "🎯👀 You Got Tagged!",
    content: `${actorUsername} just mentioned you in ${trendName} 😭🔥\nGet in there before everyone else starts talking.`,
    data: { type: "mention", trendId },
  });

  await recordNotificationSent(userId, "mention");
}

export async function sendReplyNotification(userId: string, actorUsername: string, trendName: string, trendId: string) {
  const canSend = await checkRateLimit(userId, "reply", 10);
  if (!canSend) return;

  await sendPushNotification({
    userId,
    heading: "🎬💬 Someone Replied to You",
    content: `${actorUsername} replied your message in ${trendName} 😤🔥\nDon't leave them hanging.`,
    data: { type: "reply", trendId },
  });

  await recordNotificationSent(userId, "reply");
}

export async function sendStreakNotification(userId: string, streakCount: number) {
  const canSend = await checkRateLimit(userId, "streak", 10);
  if (!canSend) return;

  const streakMessages = [
    { title: "You're on a Streak 🔥💪", content: `You've posted in ${streakCount} different trends this week. That's insane consistency — keep the energy up. 😤🔥` },
    { title: "On Fire Right Now 🔥💪", content: `${streakCount} trends, multiple posts. You're everywhere this week. The momentum is REAL. 💪🔥` },
    { title: "Dominating the Week 🔥💪", content: `${streakCount} different trends already. You're not just participating — you're taking over. 😤🔥` },
  ];

  const randomMessage = streakMessages[Math.floor(Math.random() * streakMessages.length)];

  await sendPushNotification({
    userId,
    heading: randomMessage.title,
    content: randomMessage.content,
    data: { type: "streak", streakCount: String(streakCount) },
  });

  await recordNotificationSent(userId, "streak");
}

// Rate limiting and tracking helpers
async function checkRateLimit(userId: string, type: string, dailyLimit: number): Promise<boolean> {
  const tracking = await getNotificationTracking(userId, type);
  if (!tracking) return true; // First time sending this type

  const now = new Date();
  const lastSent = new Date(tracking.lastSentAt);
  const daysDiff = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));

  // Reset count if it's a new day
  if (daysDiff >= 1) {
    return true;
  }

  // Check if under daily limit
  return (tracking.countToday || 0) < dailyLimit;
}

async function getNotificationTracking(userId: string, type: string) {
  // Query the database for notification tracking
  // This will be called by storage methods we'll add
  try {
    return await (storage as any).getNotificationTracking?.(userId, type);
  } catch {
    return null;
  }
}

async function recordNotificationSent(userId: string, type: string, variant: number = 0) {
  try {
    await (storage as any).recordNotificationSent?.(userId, type, variant);
  } catch (error) {
    console.error("Failed to record notification sent:", error);
  }
}
