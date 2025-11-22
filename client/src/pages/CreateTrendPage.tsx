import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, ArrowLeft, Plus, X, Calendar, Loader2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToR2, createPreviewURL } from "@/lib/uploadToR2";
import type { InsertTrend } from "@shared/schema";

const categories = ["Entertainment", "Sports", "AI", "Arts", "Technology", "Gaming", "Other", "Food", "Fashion", "Photography"];

export default function CreateTrendPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rules, setRules] = useState([""]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const [endDate, setEndDate] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [referencePreviewUrls, setReferencePreviewUrls] = useState<string[]>([]);
  const [includePrizes, setIncludePrizes] = useState(false);
  const [prizeFirst, setPrizeFirst] = useState("");
  const [prizeSecond, setPrizeSecond] = useState("");
  const [prizeThird, setPrizeThird] = useState("");
  
  // Track preview URLs in refs for cleanup without triggering re-renders
  const coverPreviewRef = useRef<string>("");
  const referencePreviewsRef = useRef<string[]>([]);

  // Update refs when preview URLs change
  useEffect(() => {
    coverPreviewRef.current = coverPreviewUrl;
  }, [coverPreviewUrl]);

  useEffect(() => {
    referencePreviewsRef.current = referencePreviewUrls;
  }, [referencePreviewUrls]);

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('createTrendFormData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setName(data.name || "");
        setDescription(data.description || "");
        setInstructions(data.instructions || "");
        setRules(data.rules || [""]);
        setSelectedCategory(data.selectedCategory || "");
        setEndDate(data.endDate || "");
        setIncludePrizes(data.includePrizes || false);
        setPrizeFirst(data.prizeFirst || "");
        setPrizeSecond(data.prizeSecond || "");
        setPrizeThird(data.prizeThird || "");
      } catch (e) {
        // Silently ignore localStorage errors
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const formData = {
      name,
      description,
      instructions,
      rules,
      selectedCategory,
      endDate,
      includePrizes,
      prizeFirst,
      prizeSecond,
      prizeThird,
    };
    localStorage.setItem('createTrendFormData', JSON.stringify(formData));
  }, [name, description, instructions, rules, selectedCategory, endDate, includePrizes, prizeFirst, prizeSecond, prizeThird]);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) {
        URL.revokeObjectURL(coverPreviewRef.current);
      }
      referencePreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const createTrendMutation = useMutation({
    mutationFn: async (trendData: Omit<InsertTrend, "userId"> & { coverFile?: File; referenceFiles?: File[] }) => {
      let coverPictureUrl = trendData.coverPicture;
      let referenceMediaUrls = trendData.referenceMedia || [];
      
      // Upload cover picture to R2 if provided
      if (trendData.coverFile) {
        coverPictureUrl = await uploadToR2(trendData.coverFile, 'trend-covers');
      }
      
      // Upload reference media files to R2 if provided
      if (trendData.referenceFiles && trendData.referenceFiles.length > 0) {
        referenceMediaUrls = await Promise.all(
          trendData.referenceFiles.map(file => uploadToR2(file, 'reference-media'))
        );
      }
      
      // Remove file objects from data before sending to API
      const { coverFile, referenceFiles, ...apiData } = trendData;
      const finalData = {
        ...apiData,
        coverPicture: coverPictureUrl || null,
        referenceMedia: referenceMediaUrls.length > 0 ? referenceMediaUrls : undefined,
      };
      
      const response = await apiRequest("POST", "/api/trends", finalData);
      return response.json();
    },
    onSuccess: (data) => {
      // Clean up preview URLs
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      referencePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Clear localStorage after successful submission
      localStorage.removeItem('createTrendFormData');
      
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

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10485760) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Revoke old preview URL if exists
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    // Create preview URL
    const preview = createPreviewURL(file);
    setCoverPreviewUrl(preview);
    setCoverFile(file);
  };

  const handleReferenceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    // Process all selected files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size (10MB)
      if (file.size > 10485760) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }

      newFiles.push(file);
      newPreviews.push(createPreviewURL(file));
    }

    // Add new files and previews to existing ones
    setReferenceFiles([...referenceFiles, ...newFiles]);
    setReferencePreviewUrls([...referencePreviewUrls, ...newPreviews]);
    
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeReferenceFile = (index: number) => {
    // Revoke the preview URL for the removed file
    URL.revokeObjectURL(referencePreviewUrls[index]);
    
    setReferenceFiles(referenceFiles.filter((_, i) => i !== index));
    setReferencePreviewUrls(referencePreviewUrls.filter((_, i) => i !== index));
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
    
    const trendData: Omit<InsertTrend, "userId"> & { coverFile?: File; referenceFiles?: File[] } = {
      name,
      description: description.trim() || undefined,
      instructions,
      rules: filteredRules,
      category: selectedCategory,
      coverFile: coverFile || undefined,
      referenceFiles: referenceFiles.length > 0 ? referenceFiles : undefined,
      endDate: new Date(endDate),
      prizeFirst: prizeFirst.trim() || undefined,
      prizeSecond: prizeSecond.trim() || undefined,
      prizeThird: prizeThird.trim() || undefined,
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
              {coverPreviewUrl ? (
                <div className="relative h-48 rounded-lg overflow-hidden border-2 border-border">
                  <img 
                    src={coverPreviewUrl} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                    data-testid="preview-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      URL.revokeObjectURL(coverPreviewUrl);
                      setCoverPreviewUrl("");
                      setCoverFile(null);
                    }}
                    data-testid="button-remove-cover"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label 
                  htmlFor="cover-upload" 
                  className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  data-testid="dropzone-cover"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Click to upload PNG, JPG up to 10MB
                    </p>
                  </div>
                  <Input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileSelect}
                    className="hidden"
                    data-testid="input-cover-file"
                  />
                </label>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="mb-3 block">Include Prizes?</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={includePrizes ? "default" : "outline"}
                    onClick={() => {
                      setIncludePrizes(true);
                    }}
                    data-testid="button-include-prizes-yes"
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!includePrizes ? "default" : "outline"}
                    onClick={() => {
                      setIncludePrizes(false);
                      setPrizeFirst("");
                      setPrizeSecond("");
                      setPrizeThird("");
                    }}
                    data-testid="button-include-prizes-no"
                  >
                    No
                  </Button>
                </div>
              </div>

              {includePrizes && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Prizes</h3>
                    {(prizeFirst || prizeSecond || prizeThird) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPrizeFirst("");
                          setPrizeSecond("");
                          setPrizeThird("");
                        }}
                        data-testid="button-clear-all-prizes"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="prize-first">1st Place Prize</Label>
                      <Input
                        id="prize-first"
                        placeholder="e.g., $100 or Trophy"
                        value={prizeFirst}
                        onChange={(e) => setPrizeFirst(e.target.value)}
                        data-testid="input-prize-first"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prize-second">2nd Place Prize</Label>
                      <Input
                        id="prize-second"
                        placeholder="e.g., $50 or Certificate"
                        value={prizeSecond}
                        onChange={(e) => setPrizeSecond(e.target.value)}
                        data-testid="input-prize-second"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prize-third">3rd Place Prize</Label>
                      <Input
                        id="prize-third"
                        placeholder="e.g., $25 or Badge"
                        value={prizeThird}
                        onChange={(e) => setPrizeThird(e.target.value)}
                        data-testid="input-prize-third"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reference / Sponsor(s)</Label>
              <p className="text-sm text-muted-foreground">
                Upload examples for participants to reference
              </p>
              <label 
                htmlFor="reference-upload" 
                className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                data-testid="dropzone-reference"
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload reference media (up to 10MB)
                  </p>
                </div>
                <Input
                  id="reference-upload"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleReferenceFileSelect}
                  className="hidden"
                  data-testid="input-reference-file"
                />
              </label>
              {referencePreviewUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    {referencePreviewUrls.map((url, index) => {
                      const file = referenceFiles[index];
                      const isVideo = file?.type.startsWith('video/');
                      
                      return (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          {isVideo ? (
                            <video 
                              src={url} 
                              className="w-full h-full object-cover" 
                              muted 
                              data-testid={`preview-reference-${index}`}
                            />
                          ) : (
                            <img 
                              src={url} 
                              alt={`Reference ${index + 1}`} 
                              className="w-full h-full object-cover" 
                              data-testid={`preview-reference-${index}`} 
                            />
                          )}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
                              <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {referencePreviewUrls.map((_, index) => (
                      <Button
                        key={index}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeReferenceFile(index)}
                        data-testid={`button-remove-reference-${index}`}
                      >
                        Remove Reference {index + 1}
                      </Button>
                    ))}
                  </div>
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
