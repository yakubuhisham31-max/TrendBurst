import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, ArrowLeft } from "lucide-react";

const categories = ["Entertainment", "Sports", "AI", "Arts", "Technology", "Gaming", "Music", "Food", "Fashion", "Photography"];

export default function CreateTrendPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rules, setRules] = useState(["", "", ""]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [coverImage, setCoverImage] = useState<string>();

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const handleSubmit = () => {
    console.log("Trend created:", {
      name,
      instructions,
      rules: rules.filter(r => r.trim() !== ""),
      category: selectedCategory,
      coverImage,
    });
    setLocation("/");
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
              <Label>Rules</Label>
              {rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                  <Input
                    placeholder={`Rule ${index + 1}`}
                    value={rule}
                    onChange={(e) => handleRuleChange(index, e.target.value)}
                    data-testid={`input-rule-${index + 1}`}
                  />
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

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name || !instructions || !selectedCategory}
                data-testid="button-create-trend"
              >
                Create Trend
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
