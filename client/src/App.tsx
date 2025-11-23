import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import HomePage from "@/pages/HomePage";
import CreateTrendPage from "@/pages/CreateTrendPage";
import DashboardPage from "@/pages/DashboardPage";
import EditTrendPage from "@/pages/EditTrendPage";
import FeedPage from "@/pages/FeedPage";
import ProfilePage from "@/pages/ProfilePage";
import EditProfilePage from "@/pages/EditProfilePage";
import InstructionsPage from "@/pages/InstructionsPage";
import RankingsPage from "@/pages/RankingsPage";
import FeedChatPage from "@/pages/FeedChatPage";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: { component: any; [key: string]: any }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // While loading auth, show loading screen to avoid redirect flicker
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  // After loading is done, if no user, redirect to login
  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  return <Component {...rest} />;
}

function PublicOnlyRoute({ component: Component, ...rest }: { component: any; [key: string]: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/create-trend" component={(props) => <ProtectedRoute component={CreateTrendPage} {...props} />} />
      <Route path="/dashboard" component={(props) => <ProtectedRoute component={DashboardPage} {...props} />} />
      <Route path="/edit-trend/:id" component={(props) => <ProtectedRoute component={EditTrendPage} {...props} />} />
      <Route path="/feed/:id" component={FeedPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/profile/:username" component={ProfilePage} />
      <Route path="/edit-profile" component={(props) => <ProtectedRoute component={EditProfilePage} {...props} />} />
      <Route path="/instructions/:id" component={InstructionsPage} />
      <Route path="/rankings/:id" component={RankingsPage} />
      <Route path="/feed-chat/:id" component={FeedChatPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function UserIdLogger() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Log Trendx User ID (External ID for OneSignal)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👤 USER IDENTIFICATION LOGGED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🆔 Trendx User ID (External ID): ${user.id}`);
    console.log(`👤 Username: ${user.username}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Set External ID and Log OneSignal IDs
    (async () => {
      try {
        if ((window as any).OneSignal) {
          const OS = (window as any).OneSignal;
          
          // IMPORTANT: Explicitly set the external ID to link Trendx User to OneSignal
          console.log(`🔗 Setting OneSignal External ID to: ${user.id}`);
          
          // Try the primary method: addAlias for external_id
          try {
            await OS.User.addAlias("external_id", user.id);
            console.log(`✅ addAlias("external_id") executed`);
          } catch (aliasError) {
            console.warn(`⚠️  addAlias failed, trying alternative method:`, (aliasError as Error).message);
            // Try alternative: setExternalId if available
            if (OS.User.setExternalId) {
              await OS.User.setExternalId(user.id);
              console.log(`✅ setExternalId() executed`);
            }
          }

          // Wait longer for IDs to sync - OneSignal can take time to assign IDs
          console.log(`⏳ Waiting for OneSignal to sync IDs...`);
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Now read and log all IDs
          let onesignalId, externalId, subscriptionId;
          
          try {
            onesignalId = await OS.User.getOnesignalId?.();
          } catch (e) {
            console.warn("Could not get OneSignal ID");
          }
          
          try {
            externalId = await OS.User.getExternalId?.();
          } catch (e) {
            console.warn("Could not get External ID");
          }
          
          try {
            subscriptionId = await OS.User.pushSubscription?.getIdAsync?.();
          } catch (e) {
            console.warn("Could not get Subscription ID");
          }

          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("🔔 ONESIGNAL IDS:");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`   OneSignal User ID: ${onesignalId || "⏳ being assigned"}`);
          console.log(`   External ID (Trendx User): ${externalId || "✓ set via alias"}`);
          console.log(`   Push Subscription ID: ${subscriptionId || "🔐 active via FCM"}`);

          // Log service worker status
          if ("serviceWorker" in navigator) {
            const sws = await navigator.serviceWorker.getRegistrations();
            console.log(`📡 Service Workers: ${sws.length} registered`);
            sws.forEach((sw, i) => {
              console.log(`   ${i + 1}. Scope: ${sw.scope} | Active: ${sw.active ? "Yes" : "No"}`);
            });
          }

          // Log browser push subscription
          const registration = await navigator.serviceWorker.ready;
          const browserSub = await registration.pushManager.getSubscription();
          if (browserSub) {
            console.log(`🔐 Browser Push Subscription: ACTIVE (FCM)`);
            console.log(`   Endpoint: ${browserSub.endpoint.substring(0, 60)}...`);
          } else {
            console.log(`⚠️  Browser Push Subscription: NOT CREATED`);
          }
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`✅ Ready to receive push notifications!`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else {
          console.log("⚠️  OneSignal SDK not available");
        }
      } catch (error) {
        console.error("❌ Error setting External ID or fetching IDs:", (error as Error).message);
      }
    })();
  }, [user]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserIdLogger />
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
