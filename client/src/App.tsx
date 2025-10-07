import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import CategorySelectionPage from "@/pages/CategorySelectionPage";
import RoleSelectionPage from "@/pages/RoleSelectionPage";
import HomePage from "@/pages/HomePage";
import CreateTrendPage from "@/pages/CreateTrendPage";
import DashboardPage from "@/pages/DashboardPage";
import FeedPage from "@/pages/FeedPage";
import ProfilePage from "@/pages/ProfilePage";
import EditProfilePage from "@/pages/EditProfilePage";
import InstructionsPage from "@/pages/InstructionsPage";
import RankingsPage from "@/pages/RankingsPage";
import FeedChatPage from "@/pages/FeedChatPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/onboarding/categories" component={CategorySelectionPage} />
      <Route path="/onboarding/role" component={RoleSelectionPage} />
      <Route path="/" component={HomePage} />
      <Route path="/create-trend" component={CreateTrendPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/feed/:id" component={FeedPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/profile/:username" component={ProfilePage} />
      <Route path="/edit-profile" component={EditProfilePage} />
      <Route path="/instructions/:id" component={InstructionsPage} />
      <Route path="/rankings/:id" component={RankingsPage} />
      <Route path="/feed-chat/:id" component={FeedChatPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
