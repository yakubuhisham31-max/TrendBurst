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

    // Set up OneSignal user identification after SDK is fully initialized
    (async () => {
      try {
        // Wait for OneSignal SDK to be fully initialized
        if ((window as any).OneSignalDeferred) {
          const OneSignalDeferred = (window as any).OneSignalDeferred;
          await OneSignalDeferred;
        }

        if ((window as any).OneSignal) {
          const OS = (window as any).OneSignal;
          
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("🔔 ONESIGNAL USER IDENTIFICATION");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`👤 User: ${user.username} (${user.id})`);
          console.log(`⏳ Waiting for OneSignal SDK initialization...`);
          
          // Wait for OneSignal to be fully initialized (with retry)
          let retries = 0;
          const maxRetries = 10;
          
          while (retries < maxRetries) {
            try {
              // Try to identify user with OneSignal
              await OS.login(user.id);
              console.log(`✅ User linked to OneSignal with external_id: ${user.id}`);
              break;
            } catch (loginError) {
              retries++;
              if (retries >= maxRetries) {
                console.log(`ℹ️  Could not link user after ${maxRetries} attempts`);
                console.log(`   Error:`, (loginError as Error).message);
              } else {
                // Wait 500ms before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }

          // Log service workers
          try {
            const sws = await navigator.serviceWorker.getRegistrations();
            console.log(`📡 Service Workers registered: ${sws.length}`);
            sws.forEach((sw, i) => {
              console.log(`   ${i + 1}. ${sw.scope.replace(window.location.origin, '')} (Active: ${sw.active ? '✓' : '✗'})`);
            });
          } catch (e) {
            console.log(`ℹ️  Service workers:`, (e as Error).message);
          }

          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`ℹ️  Click notification bell to subscribe to push`);
          console.log(`   Backend sends to external_id: ${user.id}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else {
          console.log("ℹ️  OneSignal SDK not available on this domain");
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
