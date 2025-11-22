import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SignupPage from "@/pages/SignupPage";
import CompleteProfilePage from "@/pages/CompleteProfilePage";
import CategorySelectionPage from "@/pages/CategorySelectionPage";
import RoleSelectionPage from "@/pages/RoleSelectionPage";
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
  const { user, loading } = useAuth();
  const [location] = useLocation();

  // While loading auth, show loading screen to avoid redirect flicker
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  // After loading is done, if no user, redirect to login with current location as redirect
  // Make sure we're not on a public route before redirecting
  if (!user && location !== "/login" && location !== "/register" && location !== "/signup") {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return <Component {...rest} />;
}

function PublicOnlyRoute({ component: Component, ...rest }: { component: any; [key: string]: any }) {
  const { user, loading } = useAuth();

  if (loading) {
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
      <Route path="/login" component={(props) => <PublicOnlyRoute component={LoginPage} {...props} />} />
      <Route path="/register" component={(props) => <PublicOnlyRoute component={RegisterPage} {...props} />} />
      <Route path="/signup" component={(props) => <PublicOnlyRoute component={SignupPage} {...props} />} />
      <Route path="/complete-profile" component={(props) => <ProtectedRoute component={CompleteProfilePage} {...props} />} />
      
      <Route path="/onboarding/categories" component={(props) => <ProtectedRoute component={CategorySelectionPage} {...props} />} />
      <Route path="/onboarding/role" component={(props) => <ProtectedRoute component={RoleSelectionPage} {...props} />} />
      <Route path="/" component={HomePage} />
      <Route path="/create-trend" component={(props) => <ProtectedRoute component={CreateTrendPage} {...props} />} />
      <Route path="/dashboard" component={(props) => <ProtectedRoute component={DashboardPage} {...props} />} />
      <Route path="/edit-trend/:id" component={(props) => <ProtectedRoute component={EditTrendPage} {...props} />} />
      <Route path="/feed/:id" component={FeedPage} />
      <Route path="/profile" component={(props) => <ProtectedRoute component={ProfilePage} {...props} />} />
      <Route path="/profile/:username" component={(props) => <ProtectedRoute component={ProfilePage} {...props} />} />
      <Route path="/edit-profile" component={(props) => <ProtectedRoute component={EditProfilePage} {...props} />} />
      <Route path="/instructions/:id" component={InstructionsPage} />
      <Route path="/rankings/:id" component={(props) => <ProtectedRoute component={RankingsPage} {...props} />} />
      <Route path="/feed-chat/:id" component={(props) => <ProtectedRoute component={FeedChatPage} {...props} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
