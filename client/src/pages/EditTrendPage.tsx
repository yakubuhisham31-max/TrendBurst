import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trend } from "@shared/schema";
import { useState } from "react";

export default function EditTrendPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/edit-trend/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const trendId = params?.id as string;
  const [instructions, setInstructions] = useState("");

  const { data: trend, isLoading } = useQuery<Trend>({
    queryKey: ["/api/trends", trendId],
    enabled: !!trendId,
    queryFn: async () => {
      const res = await fetch(`/api/trends/${trendId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trend");
      const data = await res.json();
      setInstructions(data.instructions || "");
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/trends/${trendId}/instructions`, {
        instructions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trends", trendId] });
      toast({
        title: "Instructions updated",
        description: "Trend instructions have been saved",
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update instructions",
        variant: "destructive",
      });
    },
  });

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trend || trend.userId !== user?.id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Trend not found or unauthorized</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Edit Trend Instructions</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{trend.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter trend instructions..."
                className="w-full h-64 p-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                data-testid="textarea-instructions"
              />
              <p className="text-xs text-muted-foreground mt-2">
                These instructions will be displayed to participants when they view the trend.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                data-testid="button-save-instructions"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Instructions
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
