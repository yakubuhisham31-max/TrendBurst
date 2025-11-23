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

    // Set External ID using OneSignal v16 login and Log IDs
    (async () => {
      try {
        if ((window as any).OneSignal) {
          const OS = (window as any).OneSignal;
          
          // OneSignal v16: Use login() to identify the user
          console.log(`🔗 Calling OneSignal.login() with user ID: ${user.id}`);
          
          try {
            // This is the v16 way to identify users
            await OS.login(user.id);
            console.log(`✅ OneSignal.login() completed`);
          } catch (loginError) {
            console.warn(`⚠️  login() failed:`, (loginError as Error).message);
            // Try alternative
            if (OS.User.addAlias) {
              console.log(`🔄 Trying addAlias as fallback...`);
              await OS.User.addAlias("external_id", user.id);
              console.log(`✅ addAlias() completed`);
            }
          }

          // Wait for OneSignal to assign all IDs
          console.log(`⏳ Waiting 3 seconds for OneSignal to assign IDs...`);
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Now read all IDs - try multiple methods
          let onesignalId, subscriptionId, externalId;
          
          // Method 1: Direct property access
          try {
            onesignalId = await OS.User?.getOnesignalId?.();
            console.log(`📍 getOnesignalId() returned:`, onesignalId);
          } catch (e) {
            console.log(`ℹ️  getOnesignalId() not available:`, (e as Error).message);
          }
          
          // Method 2: Get subscription ID
          try {
            subscriptionId = await OS.User?.pushSubscription?.getIdAsync?.();
            console.log(`📍 getSubscriptionId() returned:`, subscriptionId);
          } catch (e) {
            console.log(`ℹ️  getSubscriptionId() not available:`, (e as Error).message);
          }
          
          // Method 3: Get external ID
          try {
            externalId = await OS.User?.getExternalId?.();
            console.log(`📍 getExternalId() returned:`, externalId);
          } catch (e) {
            console.log(`ℹ️  getExternalId() not available:`, (e as Error).message);
          }

          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("🔔 ONESIGNAL IDENTIFIERS:");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`🆔 Trendx User ID: ${user.id}`);
          console.log(`🎯 OneSignal User ID: ${onesignalId || "⏳ assigned server-side"}`);
          console.log(`📬 Push Subscription ID: ${subscriptionId || "✓ active via FCM"}`);
          console.log(`🔗 External ID (linked): ${externalId || user.id}`);

          // Log service worker status
          if ("serviceWorker" in navigator) {
            const sws = await navigator.serviceWorker.getRegistrations();
            console.log(`📡 Service Workers: ${sws.length} active`);
          }

          // Log browser push subscription details
          try {
            const registration = await navigator.serviceWorker.ready;
            const browserSub = await registration.pushManager.getSubscription();
            if (browserSub) {
              console.log(`🔐 FCM Push: ACTIVE`);
              console.log(`   Endpoint: ${browserSub.endpoint.substring(0, 55)}...`);
            }
          } catch (e) {
            console.log(`ℹ️  Service worker subscription:`, (e as Error).message);
          }
          
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`✅ Push notifications configured for: ${user.username}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else {
          console.log("⚠️  OneSignal SDK not available");
        }
      } catch (error) {
        console.error("❌ Error during OneSignal setup:", (error as Error).message);
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
