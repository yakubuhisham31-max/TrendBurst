import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Building2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Role = "creative" | "brand" | null;

export default function RoleSelectionPage() {
  const [, setLocation] = useLocation();
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role as Role);
    }
  }, [user]);

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("PATCH", "/api/users/profile", { role });
      return response.json();
    },
    onSuccess: async () => {
      await checkAuth();
      toast({
        title: "Welcome to Trendx! 🎉",
        description: "Inspire creativity by starting exciting trends, inviting friends to join the fun, voting for your favorites, and sparking conversations in lively trend chats.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (!selectedRole) return;
    updateRoleMutation.mutate(selectedRole);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Choose Your Role</h1>
          <p className="text-muted-foreground">
            Select how you'll be using Trendx
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedRole("creative")}
            className={`relative p-8 rounded-lg border-2 transition-all hover-elevate ${
              selectedRole === "creative"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            data-testid="role-creative"
          >
            {selectedRole === "creative" && (
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Creative (User)</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Join trends, create posts, and engage with the community
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole("brand")}
            className={`relative p-8 rounded-lg border-2 transition-all hover-elevate ${
              selectedRole === "brand"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            data-testid="role-brand"
          >
            {selectedRole === "brand" && (
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-chart-2/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-chart-2" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Brand</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create trends, manage campaigns, and discover talent
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/onboarding/categories")}
            className="flex-1"
            data-testid="button-back"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || updateRoleMutation.isPending}
            className="flex-1"
            data-testid="button-continue"
          >
            {updateRoleMutation.isPending ? "Setting up..." : "Get Started"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
