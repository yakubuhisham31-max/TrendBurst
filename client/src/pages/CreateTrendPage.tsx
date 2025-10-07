import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, ArrowLeft, Plus, X, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertTrend } from "@shared/schema";

const categories = ["Entertainment", "Sports", "AI", "Arts", "Technology", "Gaming", "Music", "Food", "Fashion", "Photography"];

export default function CreateTrendPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rules, setRules] = useState([""]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [coverImage, setCoverImage] = useState<string>();
  const [endDate, setEndDate] = useState("");
  const [referenceMedia, setReferenceMedia] = useState<string[]>([]);

  const createTrendMutation = useMutation({
    mutationFn: async (trendData: Omit<InsertTrend, "userId">) => {
      const response = await apiRequest("POST", "/api/trends", trendData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trends"] });
      toast({
        title: "Success!",
        description: "Your trend has been created successfully.",
      });
      setLocation(`/feed/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create trend. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const addRule = () => {
    setRules([...rules, ""]);
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a trend.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    const filteredRules = rules.filter(r => r.trim() !== "");
    
    const trendData: Omit<InsertTrend, "userId"> = {
      name,
      instructions,
      rules: filteredRules,
      category: selectedCategory,
      coverPicture: coverImage || null,
      referenceMedia: referenceMedia.length > 0 ? referenceMedia : null,
      endDate: endDate ? new Date(endDate) : null,
    };

    createTrendMutation.mutate(trendData);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Create New Trend</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trend-name">Trend Name</Label>
              <Input
                id="trend-name"
                placeholder="Enter trend name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-trend-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Describe how this trend works"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-instructions"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rules</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                  className="gap-1"
                  data-testid="button-add-rule"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </Button>
              </div>
              {rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                  <Input
                    placeholder={`Rule ${index + 1}`}
                    value={rule}
                    onChange={(e) => handleRuleChange(index, e.target.value)}
                    data-testid={`input-rule-${index + 1}`}
                  />
                  {rules.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRule(index)}
                      className="h-9 w-9 flex-shrink-0"
                      data-testid={`button-remove-rule-${index + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedCategory(cat)}
                    data-testid={`button-category-${cat.toLowerCase()}`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9"
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover Picture</Label>
              <div className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center bg-muted/20 hover-elevate cursor-pointer" data-testid="dropzone-cover">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference (Images/Videos)</Label>
              <p className="text-sm text-muted-foreground">
                Upload examples for participants to reference
              </p>
              <div className="border-2 border-dashed rounded-lg h-32 flex items-center justify-center bg-muted/20 hover-elevate cursor-pointer" data-testid="dropzone-reference">
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload reference media
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images or Videos
                  </p>
                </div>
              </div>
              {referenceMedia.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {referenceMedia.map((media, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-chart-2/20" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                disabled={createTrendMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name || !instructions || !selectedCategory || createTrendMutation.isPending}
                data-testid="button-create-trend"
              >
                {createTrendMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {createTrendMutation.isPending ? "Creating..." : "Create Trend"}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
