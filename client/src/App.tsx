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

    // Identify user with OneSignal and ensure push subscription
    (async () => {
      try {
        if ((window as any).OneSignal) {
          const OS = (window as any).OneSignal;
          
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("🔔 PUSH NOTIFICATION SETUP");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`👤 User Identified: ${user.username} (${user.id})`);
          
          // Step 1: Request notification permission from the user
          try {
            const permission = await Notification.requestPermission();
            console.log(`🔔 Notification permission: ${permission}`);
          } catch (permError) {
            console.log(`ℹ️  Permission request failed:`, (permError as Error).message);
          }

          // Step 2: Ensure service worker is registered and subscription exists
          try {
            if ('serviceWorker' in navigator && 'pushManager' in ServiceWorkerRegistration.prototype) {
              const reg = await navigator.serviceWorker.ready;
              let subscription = await reg.pushManager.getSubscription();
              
              if (!subscription) {
                console.log("📬 No subscription found, creating new push subscription...");
                try {
                  const vapidPublicKey = "BN7u6gR0gp6YYzXLKhPcFqKzJQj4iEA_DPEEDYzJKZhJmGVvFBf3vLqZ6XH1oX8S_l7ZCFOV8Iv8r5WCVCA2LO4";
                  subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: vapidPublicKey,
                  });
                  console.log("✅ New push subscription created!");
                } catch (subError) {
                  console.log("ℹ️  Could not create subscription:", (subError as Error).message);
                }
              }
              
              if (subscription) {
                console.log(`🔐 Push Subscription: ACTIVE`);
                console.log(`   Provider: Firebase Cloud Messaging (FCM)`);
                console.log(`   Endpoint: ${subscription.endpoint.substring(0, 60)}...`);
              }
            }
          } catch (e) {
            console.log(`ℹ️  Service worker/subscription check:`, (e as Error).message);
          }

          // Step 3: Wait a bit for OneSignal to settle, then identify the user
          await new Promise(resolve => setTimeout(resolve, 500));

          // Identify user with OneSignal
          try {
            await OS.login(user.id);
            console.log(`✅ User linked to OneSignal`);
          } catch (loginError) {
            console.log(`ℹ️  OneSignal.login() pending:`, (loginError as Error).message);
          }

          // Step 4: Log final subscription status
          try {
            const sws = await navigator.serviceWorker.getRegistrations();
            console.log(`📡 Service Workers: ${sws.length}`);
            sws.forEach((sw, i) => {
              console.log(`   ${i + 1}. ${sw.scope.replace(window.location.origin, '')} (Active: ${sw.active ? '✓' : '✗'})`);
            });
          } catch (e) {
            console.log(`ℹ️  Service workers:`, (e as Error).message);
          }

          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`✅ Push notifications enabled`);
          console.log(`   Backend will send to: ${user.id}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else {
          console.log("ℹ️  OneSignal SDK initializing...");
        }
      } catch (error) {
        console.log("ℹ️  OneSignal setup:", (error as Error).message);
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
