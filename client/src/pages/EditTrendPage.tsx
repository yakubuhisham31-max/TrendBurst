import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Upload, X, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { uploadToR2, createPreviewURL } from "@/lib/uploadToR2";
import type { Trend } from "@shared/schema";
import { useState, useEffect, useRef } from "react";

const getMediaType = (url: string): "image" | "video" => {
  return url.match(/\.(mp4|webm|mov|avi|mkv)$/i) ? "video" : "image";
};

export default function EditTrendPage({ params }: { params: any }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const trendId = params?.id as string;
  const [instructions, setInstructions] = useState("");
  const [referenceMedia, setReferenceMedia] = useState<string[]>([]);
  const [newReferenceFiles, setNewReferenceFiles] = useState<File[]>([]);
  const [referencePreviewUrls, setReferencePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referencePreviewsRef = useRef<string[]>([]);

  useEffect(() => {
    referencePreviewsRef.current = referencePreviewUrls;
  }, [referencePreviewUrls]);

  useEffect(() => {
    return () => {
      referencePreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const { data: trend, isLoading } = useQuery<Trend>({
    queryKey: ["/api/trends", trendId],
    enabled: !!trendId,
    queryFn: async () => {
      const res = await fetch(`/api/trends/${trendId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trend");
      const data = await res.json();
      setInstructions(data.instructions || "");
      setReferenceMedia(data.referenceMedia || []);
      return data;
    },
  });

  const handleAddReferenceMedia = () => {
    fileInputRef.current?.click();
  };

  const handleReferenceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      setNewReferenceFiles(prev => [...prev, file]);
      const previewUrl = createPreviewURL(file);
      setReferencePreviewUrls(prev => [...prev, previewUrl]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveReferenceMedia = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setReferenceMedia(prev => prev.filter((_, i) => i !== index));
    } else {
      const adjustedIndex = index - referenceMedia.length;
      const oldUrl = referencePreviewUrls[index];
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      setNewReferenceFiles(prev => prev.filter((_, i) => i !== adjustedIndex));
      setReferencePreviewUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      let updatedReferenceMedia = [...referenceMedia];

      // Upload new reference media files to R2 if provided
      if (newReferenceFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          newReferenceFiles.map(file => uploadToR2(file, 'reference-media'))
        );
        updatedReferenceMedia = [...updatedReferenceMedia, ...uploadedUrls];
      }

      return apiRequest("PATCH", `/api/trends/${trendId}`, {
        instructions,
        referenceMedia: updatedReferenceMedia,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trends", trendId] });
      toast({
        title: "Trend updated",
        description: "Instructions and reference media have been saved",
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update trend",
        variant: "destructive",
      });
    },
  });

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

  const allReferencePreviews = [
    ...referenceMedia.map(url => ({ url, type: "existing" as const })),
    ...referencePreviewUrls.slice(referenceMedia.length).map(url => ({ url, type: "new" as const }))
  ];

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
          <h1 className="text-xl font-bold">Edit Trend</h1>
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
                className="w-full h-40 p-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                data-testid="textarea-instructions"
              />
              <p className="text-xs text-muted-foreground mt-2">
                These instructions will be displayed to participants when they view the trend.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reference/Sponsor Media</label>
              <p className="text-xs text-muted-foreground mb-3">
                Add images or videos for reference or sponsor content
              </p>

              {allReferencePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {allReferencePreviews.map((item, index) => {
                    const mediaType = getMediaType(item.url);
                    return (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                        {mediaType === "video" ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover pointer-events-none"
                            muted
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt="Reference media"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        )}
                        {mediaType === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-t from-black/20 to-transparent">
                            <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center group-hover:bg-white/50 transition-colors">
                              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleRemoveReferenceMedia(index, item.type === "existing")}
                          className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-reference-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleReferenceFileSelect}
                className="hidden"
                data-testid="input-reference-media"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddReferenceMedia}
                className="w-full"
                data-testid="button-add-reference-media"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Reference Media
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                data-testid="button-save-trend"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
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
