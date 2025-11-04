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
import { ObjectUploader } from "@/components/ObjectUploader";
import type { InsertTrend } from "@shared/schema";

const categories = ["Entertainment", "Sports", "AI", "Arts", "Technology", "Gaming", "Music", "Food", "Fashion", "Photography"];

export default function CreateTrendPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rules, setRules] = useState([""]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [coverImage, setCoverImage] = useState<string>();
  const [endDate, setEndDate] = useState("");
  const [referenceMedia, setReferenceMedia] = useState<string[]>([]);
  const [coverPublicURL, setCoverPublicURL] = useState<string>();
  const [referencePublicURL, setReferencePublicURL] = useState<string>();

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

  const getCoverUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/object-storage/upload-url", {
      path: `trend-covers/${Date.now()}.jpg`,
      isPublic: true,
    });
    const data = await response.json();
    // Store the public URL for later use
    setCoverPublicURL(data.publicUrl);
    return {
      method: "PUT" as const,
      url: data.uploadUrl,
    };
  };

  const handleCoverUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      // Use the public URL provided by the backend
      setCoverImage(coverPublicURL);
      toast({
        title: "Success",
        description: "Cover picture uploaded successfully",
      });
    }
  };

  const getReferenceUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/object-storage/upload-url", {
      path: `trend-references/${Date.now()}.jpg`,
      isPublic: true,
    });
    const data = await response.json();
    // Store the public URL for later use
    setReferencePublicURL(data.publicUrl);
    return {
      method: "PUT" as const,
      url: data.uploadUrl,
    };
  };

  const handleReferenceUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      // Use the public URL provided by the backend
      if (referencePublicURL) {
        setReferenceMedia([...referenceMedia, referencePublicURL]);
        toast({
          title: "Success",
          description: "Reference media uploaded successfully",
        });
      }
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

    // Validate end date is provided
    if (!endDate) {
      toast({
        title: "Missing End Date",
        description: "End date is required for creating a trend.",
        variant: "destructive",
      });
      return;
    }

    const todayString = new Date().toISOString().split('T')[0];
    
    if (endDate < todayString) {
      toast({
        title: "Invalid End Date",
        description: "End date cannot be in the past.",
        variant: "destructive",
      });
      return;
    }

    const filteredRules = rules.filter(r => r.trim() !== "");
    
    const trendData: Omit<InsertTrend, "userId"> = {
      name,
      description: description.trim() || undefined,
      instructions,
      rules: filteredRules,
      category: selectedCategory,
      coverPicture: coverImage || null,
      referenceMedia: referenceMedia.length > 0 ? referenceMedia : undefined,
      endDate: endDate, // Send as string, schema will transform to Date
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
              <Label htmlFor="description">Short Description</Label>
              <Input
                id="description"
                placeholder="A few words describing this trend (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={51}
                data-testid="input-description"
              />
              <p className="text-xs text-muted-foreground">{description.length}/51 characters</p>
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
              <Label htmlFor="end-date">End Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-9"
                  data-testid="input-end-date"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set an end date for this trend (required)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cover Picture</Label>
              {coverImage ? (
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img 
                    src={coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setCoverImage(undefined)}
                    data-testid="button-remove-cover"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center bg-muted/20">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      PNG, JPG up to 10MB
                    </p>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={getCoverUploadParameters}
                      onComplete={handleCoverUploadComplete}
                      variant="outline"
                      buttonClassName="data-testid-dropzone-cover"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Cover Picture
                    </ObjectUploader>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reference (Images/Videos)</Label>
              <p className="text-sm text-muted-foreground">
                Upload examples for participants to reference
              </p>
              <div className="border-2 border-dashed rounded-lg h-32 flex items-center justify-center bg-muted/20">
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={getReferenceUploadParameters}
                    onComplete={handleReferenceUploadComplete}
                    variant="outline"
                    buttonClassName="data-testid-dropzone-reference"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Reference Media
                  </ObjectUploader>
                </div>
              </div>
              {referenceMedia.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {referenceMedia.map((media, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={media} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setReferenceMedia(referenceMedia.filter((_, i) => i !== index))}
                        data-testid={`button-remove-reference-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
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
                disabled={!name || !instructions || !selectedCategory || !endDate || createTrendMutation.isPending}
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
