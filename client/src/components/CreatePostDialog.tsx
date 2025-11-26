import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, ArrowRight } from "lucide-react";
import { uploadToR2, createPreviewURL } from "@/lib/uploadToR2";
import { useToast } from "@/hooks/use-toast";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: { mediaUrl: string; mediaType: 'image' | 'video'; caption: string }) => void;
}

export default function CreatePostDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreatePostDialogProps) {
  const [step, setStep] = useState<'select' | 'preview'>('select'); // Two-step flow
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Clean up and reset when dialog closes
  useEffect(() => {
    if (!open) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
      setSelectedFile(null);
      setCaption("");
      setStep('select'); // Reset to first step
    }
  }, [open]);

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB)
    if (file.size > 52428800) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    // Revoke old preview URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Detect file type
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    // Create preview URL
    const preview = createPreviewURL(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      // Upload to R2 in the 'posts' folder with progress tracking
      const publicUrl = await uploadToR2(selectedFile, 'posts', (progress) => {
        setUploadProgress(progress);
      });
      
      if (onSubmit) {
        onSubmit({ mediaUrl: publicUrl, mediaType, caption });
      }

      // Clean up
      URL.revokeObjectURL(previewUrl);
      setCaption("");
      setPreviewUrl("");
      setSelectedFile(null);
      setMediaType('image');
      setUploadProgress(0);
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Upload error details:", error);
      toast({
        title: "Upload failed",
        description: errorMessage || "Failed to upload media. Check browser console for details.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-create-post">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Create Post' : 'Add Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' 
              ? 'Select an image or video to share' 
              : 'Add a caption to your post'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'select' ? (
            // Step 1: File Selection
            <>
              <div className="space-y-2">
                <Label>Image or Video</Label>
                <label 
                  htmlFor="media-upload" 
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  data-testid="dropzone-media"
                >
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-base font-medium text-foreground mb-1">
                      {selectedFile ? selectedFile.name : 'Select file'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Images (PNG, JPG) or Videos (MP4, WebM) up to 50MB
                    </p>
                  </div>
                  <Input
                    id="media-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-media-file"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep('preview')}
                  disabled={!selectedFile}
                  data-testid="button-next"
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            // Step 2: Preview + Caption
            <>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted">
                  {mediaType === 'video' ? (
                    <video 
                      src={previewUrl} 
                      controls 
                      className="w-full h-auto max-h-96 object-contain"
                      data-testid="preview-video"
                    />
                  ) : (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-auto max-h-96 object-contain"
                      data-testid="preview-image"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write a caption for your post..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="input-caption"
                  autoFocus
                  disabled={isUploading}
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Uploading...</Label>
                    <span className="text-sm font-medium text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" data-testid="progress-upload" />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('select')}
                  disabled={isUploading}
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedFile || isUploading}
                  data-testid="button-create-post"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
