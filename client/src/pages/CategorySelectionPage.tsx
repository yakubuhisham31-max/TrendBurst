import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const categories = [
  "AI",
  "Arts",
  "Entertainment",
  "Fashion",
  "Fitness",
  "Food",
  "Gaming",
  "Music",
  "Other",
  "Photography",
  "Sports",
  "Technology",
  "Travel",
];

export default function CategorySelectionPage() {
  const [, setLocation] = useLocation();
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (user?.categories) {
      setSelectedCategories(user.categories);
    }
  }, [user]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const updateCategoriesMutation = useMutation({
    mutationFn: async (categories: string[]) => {
      const response = await apiRequest("PATCH", "/api/users/profile", { categories });
      return response.json();
    },
    onSuccess: async () => {
      await checkAuth();
      setLocation("/onboarding/role");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update categories.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    updateCategoriesMutation.mutate(selectedCategories);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Choose Your Interests</h1>
          <p className="text-muted-foreground">
            Select categories to get notifications about new trends
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`relative p-4 rounded-lg border-2 transition-all hover-elevate ${
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50"
                }`}
                data-testid={`category-${category.toLowerCase()}`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <p className="font-medium">{category}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/login")}
            className="flex-1"
            data-testid="button-back"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={selectedCategories.length === 0 || updateCategoriesMutation.isPending}
            className="flex-1"
            data-testid="button-continue"
          >
            {updateCategoriesMutation.isPending 
              ? "Saving..." 
              : `Continue ${selectedCategories.length > 0 ? `(${selectedCategories.length})` : ""}`
            }
          </Button>
        </div>
      </Card>
    </div>
  );
}
