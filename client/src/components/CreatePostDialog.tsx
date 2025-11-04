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
import { Upload, Loader2 } from "lucide-react";
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
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Clean up preview URL when dialog closes
  useEffect(() => {
    if (!open && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setSelectedFile(null);
      setCaption("");
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
    try {
      // Upload to R2 in the 'posts' folder
      const publicUrl = await uploadToR2(selectedFile, 'posts');
      
      if (onSubmit) {
        onSubmit({ mediaUrl: publicUrl, mediaType, caption });
      }

      // Clean up
      URL.revokeObjectURL(previewUrl);
      setCaption("");
      setPreviewUrl("");
      setSelectedFile(null);
      setMediaType('image');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-create-post">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Upload an image or video and add a caption to share with the trend
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Image or Video</Label>
            {previewUrl ? (
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
                <div className="absolute top-2 right-2">
                  <Button
                    variant="secondary"
                    className="gap-2 shadow-lg"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl("");
                      setSelectedFile(null);
                    }}
                    data-testid="button-change-media"
                  >
                    <Upload className="w-4 h-4" />
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <label 
                htmlFor="media-upload" 
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                data-testid="dropzone-media"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
            )}
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
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              data-testid="button-cancel"
            >
              Cancel
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
